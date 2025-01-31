import json
import torch
from embedding_utils import generate_embeddings  # 분리된 함수 임포트

# JSON 데이터 로드
with open('data.json', 'r') as file:
    data = json.load(file)

# 데이터 분리
titles = [entry['title'] for entry in data]
questions = [entry['question'] for entry in data]
answers = [entry['answer'] for entry in data]

# 임베딩 생성
print("임베딩 생성 중...")
print("제목 임베딩 생성 중...")
title_embeddings = generate_embeddings(titles)
print("제목 임베딩 생성 완료")
print("질문 임베딩 생성 중...")
question_embeddings = generate_embeddings(questions)
print("질문 임베딩 생성 완료")
print("답변 임베딩 생성 중...")
answer_embeddings = generate_embeddings(answers)
print("답변 임베딩 생성 완료")

# 임베딩 저장
torch.save({
    'title_embeddings': title_embeddings,
    'question_embeddings': question_embeddings,
    'answer_embeddings': answer_embeddings
}, 'embeddings.pt')

print("임베딩 저장 완료: embeddings.pt")
