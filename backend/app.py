from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import torch
from embedding_utils import generate_embeddings  # 분리된 함수 임포트
import boto3
from dotenv import load_dotenv
import os

app = Flask(__name__)
CORS(app)

# AWS Bedrock 설정
bedrock_client = boto3.client(
    service_name="bedrock-runtime",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)


# Claude 모델을 호출하여 응답 생성
def claude_response(prompt):
    """
    Claude Sonnet v2.0을 사용해 답변 생성.
    """
    completion = bedrock_client.invoke_model(
        modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2048,
            "temperature": 0.7,  # 생성 텍스트의 다양성
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

# JSON 데이터 로드
with open('data.json', 'r') as file:
    data = json.load(file)

# 사전 계산된 임베딩 로드
embeddings = torch.load('embeddings.pt')
title_embeddings = embeddings['title_embeddings']
question_embeddings = embeddings['question_embeddings']
answer_embeddings = embeddings['answer_embeddings']

# 유사 질문 검색 로직
def find_similar_questions(user_question, data, title_embeddings, question_embeddings, answer_embeddings):
    """
    사용자의 질문과 유사한 질문을 데이터에서 검색하는 함수.
    """
    # 사용자 질문 임베딩 생성
    user_embedding = generate_embeddings([user_question])

    # 코사인 유사도 계산
    title_similarities = torch.nn.functional.cosine_similarity(user_embedding, title_embeddings)
    question_similarities = torch.nn.functional.cosine_similarity(user_embedding, question_embeddings)
    answer_similarities = torch.nn.functional.cosine_similarity(user_embedding, answer_embeddings)
    
    # 가중치 적용하여 최종 점수 계산
    combined_scores = (
        0.5 * title_similarities +
        0.3 * question_similarities +
        0.2 * answer_similarities
    )
    
    # 유사도 높은 순으로 정렬
    similar_indices = torch.argsort(combined_scores, descending=True)[:3]
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

    # Claude에 전달할 프롬프트 생성
    prompt = f"질문: {user_question}\n"
    for i, item in enumerate(similar_questions):
        prompt += f"유사 질문{i+1}: {item['question']}\n답변{i+1}: {item['answer']}\n"
    prompt += "위 질문들과 답변을 참고하여 새롭고 유용한 답변을 생성해 주세요."

    # Claude로 답변 생성
    generated_answer = claude_response(prompt)

    # 응답 반환
    return jsonify({
        "generated_answer": generated_answer,  # Claude에서 생성된 답변
        "details": similar_questions          # 기존 유사 질문 목록
    })

if __name__ == '__main__':
    app.run(debug=True)
