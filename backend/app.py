from flask import Flask, Response, request, jsonify
from flask_cors import CORS
import json
import torch
from embedding_utils import generate_embeddings
import boto3
from dotenv import load_dotenv
import os

# .env 파일 로드
load_dotenv()

app = Flask(__name__)
CORS(app)

# AWS Bedrock 설정
bedrock_client = boto3.client(
    "bedrock-runtime",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

MODEL_TYPE = os.getenv("MODEL_TYPE", "claude")  # 기본값 Claude

# S3 설정
s3_client = boto3.client(
    "s3",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
EMBEDDINGS_FILE_KEY = os.getenv("EMBEDDINGS_FILE_KEY", "embeddings.pt")
DATA_FILE_KEY = os.getenv("DATA_FILE_KEY", "data.json")
LOCAL_EMBEDDINGS_PATH = "embeddings.pt"
LOCAL_DATA_PATH = "data.json"

# S3에서 파일 다운로드 함수
def download_file_from_s3(bucket_name, file_key, local_path):
    try:
        print(f"Downloading {file_key} from S3 bucket {bucket_name}...")
        s3_client.download_file(bucket_name, file_key, local_path)
        print(f"File {file_key} successfully downloaded to {local_path}.")
    except Exception as e:
        print(f"Error downloading {file_key} from S3: {e}")
        raise

openai_client = None
if MODEL_TYPE == "openai":
    from openai import OpenAI
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
# 서버 시작 시 S3에서 파일 다운로드
print(f"local embeddings exist: {os.path.exists(LOCAL_EMBEDDINGS_PATH)}")
if not os.path.exists(LOCAL_EMBEDDINGS_PATH):
    download_file_from_s3(S3_BUCKET_NAME, EMBEDDINGS_FILE_KEY, LOCAL_EMBEDDINGS_PATH)

print(f"local data exists: {os.path.exists(LOCAL_DATA_PATH)}")
if os.path.exists(LOCAL_DATA_PATH):
    with open(LOCAL_DATA_PATH, 'r') as file:
        print(file.read())
if not os.path.exists(LOCAL_DATA_PATH):
    download_file_from_s3(S3_BUCKET_NAME, DATA_FILE_KEY, LOCAL_DATA_PATH)

# JSON 데이터 로드
with open(LOCAL_DATA_PATH, 'r') as file:
    data = json.load(file)

# 사전 계산된 임베딩 로드
embeddings = torch.load(LOCAL_EMBEDDINGS_PATH)
title_embeddings = embeddings["title_embeddings"]
question_embeddings = embeddings["question_embeddings"]
answer_embeddings = embeddings["answer_embeddings"]

# Claude 모델의 스트리밍 응답
def claude_stream_response(prompt):
    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 2048,
        "temperature": 0.7,
        "messages": [
            {"role": "user", "content": [{"type": "text", "text": prompt}]}
        ]
    }

    # Bedrock 스트리밍 API 호출
    response = bedrock_client.invoke_model_with_response_stream(
        modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
        body=json.dumps(request_body)
    )

    # AWS Bedrock 이벤트 스트림 처리
    event_stream = response.get('body', {})
    for event in event_stream:
        chunk = event.get('chunk')  # 스트리밍 청크 데이터 추출
        if chunk:
            try:
                # 청크를 JSON으로 디코딩
                message = json.loads(chunk.get("bytes").decode())

                # 메시지 타입 처리
                if message["type"] == "content_block_delta":
                    yield message["delta"]["text"] or ""
                elif message["type"] == "message_stop":
                    return "\n"  # 스트리밍 종료
            except (KeyError, json.JSONDecodeError) as e:
                print(f"Error processing event: {e}")  # 에러 처리

# OpenAI 모델의 스트리밍 응답
def openai_stream_response(prompt):
    if not openai_client:
        raise ValueError("OpenAI client is not initialized. Check MODEL_TYPE or API_KEY.")

    # OpenAI 스트리밍 API 호출
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "친근하고 상세한 검색형 답변을 생성하세요."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        stream=True
    )

    # OpenAI 스트림 데이터 처리
    for chunk in response:
        try:
            # 각 청크의 데이터를 확인
            if hasattr(chunk, "choices") and chunk.choices:
                # delta에서 content 추출
                delta = chunk.choices[0].delta
                if hasattr(delta, "content") and delta.content:
                    content = delta.content
                    yield content
            else:
                print("No valid content in chunk:", chunk)  # 디버깅
        except Exception as e:
            print(f"Error processing OpenAI chunk: {e}")  # 디버깅 출력


# 유사 질문 검색 로직
def find_similar_questions(user_question):
    user_embedding = generate_embeddings([user_question])
    title_similarities = torch.nn.functional.cosine_similarity(user_embedding, title_embeddings)
    question_similarities = torch.nn.functional.cosine_similarity(user_embedding, question_embeddings)
    answer_similarities = torch.nn.functional.cosine_similarity(user_embedding, answer_embeddings)
    
    combined_scores = (
        0.5 * title_similarities +
        0.3 * question_similarities +
        0.2 * answer_similarities
    )
    
    similar_indices = torch.argsort(combined_scores, descending=True)[:4]
    results = [
        {
            "title": data[i]["title"],
            "question": data[i]["question"],
            "answer": data[i]["answer"],
            "source": data[i]["source"],
            "similarity": combined_scores[i].item()
        }
        for i in similar_indices
    ]
    return results

# 프롬프트 생성 함수
def generate_prompt(user_question, similar_questions):
    prompt = (
        "당신은 정보를 검색하고 요약하는 검색 엔진 역할을 합니다. "
        "사용자의 질문에 대해 다양한 출처를 참고하여 친근하고 이해하기 쉬운 답변을 작성하세요. "
        "답변은 명확하고 구체적이며, 충분히 상세해야 합니다. "
        "답변 중간에는 [1], [2]와 같은 형식으로 출처를 명시하세요.\n\n"
    )
    prompt += f"사용자의 질문: {user_question}\n\n"
    prompt += "다음은 참고할 수 있는 출처입니다:\n"
    
    for i, item in enumerate(similar_questions, start=1):
        prompt += (
            f"출처 {i}:\n"
            f" - 질문: {item['question']}\n"
            f" - 답변: {item['answer']}\n"
        )
    
    prompt += (
        "\n위 출처를 바탕으로 사용자의 질문에 대해 상세하고 자연스러운 답변을 작성하세요. "
        "답변은 친근하고 쉽게 이해할 수 있도록 작성하며, 사용자가 관심을 가질만한 배경 설명도 포함하세요."
    )
    
    return prompt

# API 엔드포인트: 유사 질문 반환
@app.route('/api/question_details', methods=['POST'])
def get_question_details():
    user_data = request.json
    user_question = user_data.get("user_question")

    similar_questions = find_similar_questions(user_question)
    return jsonify({"details": similar_questions})

# API 엔드포인트: AI 생성 답변 스트리밍
@app.route('/api/stream_generated_answer', methods=['POST'])
def stream_generated_answer():
    user_data = request.json
    user_question = user_data.get("user_question")

    similar_questions = find_similar_questions(user_question)
    prompt = generate_prompt(user_question, similar_questions)

    if MODEL_TYPE == "claude":
        response_stream = claude_stream_response(prompt)
    elif MODEL_TYPE == "openai":
        response_stream = openai_stream_response(prompt)
    else:
        return jsonify({"error": f"Unsupported model type: {MODEL_TYPE}"}), 400

    def generate():
        for chunk in response_stream:
            if chunk:
                yield chunk
            else:
                print("Empty chunk received")  # 디버깅

    return Response(
        generate(),
        content_type="text/plain; charset=utf-8",
        headers={"Transfer-Encoding": "chunked"}
    )
    
# Health Check Endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """
    헬스 체크 엔드포인트.
    서버가 정상적으로 실행되고 있는지 확인합니다.
    """
    return jsonify({"status": "healthy", "message": "Server is running properly"}), 200



if __name__ == "__main__":
    # FLASK_ENV 환경 변수를 확인하여 로컬 개발 환경에서만 실행
    if os.getenv("FLASK_ENV", "production") == "development":
        print("Running in development mode with Flask server...")
        app.run(host='0.0.0.0', port=os.getenv("PORT", 5000), debug=True)
    else:
        print("Running in production mode. Use a WSGI server like Gunicorn.")
