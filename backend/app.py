from flask import Flask, request, jsonify
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
    service_name="bedrock-runtime",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

# 모델 선택
MODEL_TYPE = os.getenv("MODEL_TYPE", "claude")  # 기본값을 Claude로 설정

# OpenAI 설정 (조건부 생성)
openai_client = None
if MODEL_TYPE == "openai":
    from openai import OpenAI
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Claude 모델 응답 생성
def claude_response(prompt):
    completion = bedrock_client.invoke_model(
        modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2048,
            "temperature": 0.7,
            "messages": [
                {
                    "role": "user",
                    "content": [{"type": "text", "text": prompt}],
                }
            ],
        })
    )
    response = json.loads(completion["body"].read())
    return response["content"][0]["text"]

# OpenAI 모델 응답 생성
def openai_response(prompt):
    if not openai_client:
        raise ValueError("OpenAI client is not initialized. Check MODEL_TYPE or API_KEY.")
    completion = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 정보를 검색하여 요약하는 검색 엔진처럼 행동합니다. "
                    "사용자의 질문에 대해 다양한 출처를 참고하여 친근하고 이해하기 쉬운 답변을 작성하세요. "
                    "답변은 명확하고 구체적이며, 충분히 상세해야 합니다. "
                    "답변 중간에 출처를 [1], [2]와 같은 형식으로 명시하세요."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
    )
    response = completion.choices[0].message.content
    return response


# JSON 데이터 로드
with open('data.json', 'r') as file:
    data = json.load(file)

# 사전 계산된 임베딩 로드
embeddings = torch.load('embeddings.pt')
title_embeddings = embeddings['title_embeddings']
question_embeddings = embeddings['question_embeddings']
answer_embeddings = embeddings['answer_embeddings']

# 프롬프트 생성 함수
def generate_prompt(user_question, similar_questions):
    """
    AI 모델에 전달할 프롬프트를 생성합니다. 상세하고 자연스러운 답변을 유도하도록 설계되었습니다.
    """
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



# 유사 질문 검색 로직
def find_similar_questions(user_question, data, title_embeddings, question_embeddings, answer_embeddings):
    """
    사용자의 질문과 유사한 질문을 데이터에서 검색하는 함수.
    """
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

# 질문 API 엔드포인트
@app.route('/api/question', methods=['POST'])
def get_answer():
    """
    사용자의 질문에 대한 응답을 반환하는 엔드포인트.
    """
    user_data = request.json
    user_question = user_data.get("user_question")

    # 유사한 질문 검색
    similar_questions = find_similar_questions(user_question, data, title_embeddings, question_embeddings, answer_embeddings)

    # 프롬프트 생성
    prompt = generate_prompt(user_question, similar_questions)

    # 선택된 모델에 따라 응답 생성
    if MODEL_TYPE == "claude":
        generated_answer = claude_response(prompt)
    elif MODEL_TYPE == "openai":
        generated_answer = openai_response(prompt)
    else:
        return jsonify({"error": f"Unsupported model type: {MODEL_TYPE}"}), 400

    # 응답 반환
    return jsonify({
        "generated_answer": generated_answer,
        "details": similar_questions
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=os.getenv("PORT", 5000), debug=True)
