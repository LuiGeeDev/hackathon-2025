from transformers import AutoTokenizer, AutoModel
import torch
from tqdm import tqdm  # 진행률 표시 라이브러리

# 모델 로드
MODEL_NAME = 'BM-K/KoSimCSE-roberta-multitask'
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModel.from_pretrained(MODEL_NAME)

# Mean Pooling 함수
def mean_pooling(model_output, attention_mask):
    token_embeddings = model_output.last_hidden_state
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size())
    return torch.sum(token_embeddings * input_mask_expanded, dim=1) / torch.clamp(input_mask_expanded.sum(dim=1), min=1e-9)

# 텍스트 임베딩 생성 함수
def generate_embeddings(texts, batch_size=32):
    """
    텍스트 리스트를 입력받아 임베딩을 생성합니다.
    tqdm을 활용해 진행률을 표시합니다.

    Args:
        texts (list): 입력 텍스트 리스트
        batch_size (int): 배치 크기
    Returns:
        torch.Tensor: 임베딩 텐서
    """
    embeddings = []
    
    # 배치 단위로 임베딩 생성
    for i in tqdm(range(0, len(texts), batch_size), desc="임베딩 생성 중", unit="batch"):
        batch_texts = texts[i:i+batch_size]
        encoded_input = tokenizer(batch_texts, padding=True, truncation=True, return_tensors='pt', max_length=512)
        with torch.no_grad():
            model_output = model(**encoded_input)
        batch_embeddings = mean_pooling(model_output, encoded_input['attention_mask'])
        embeddings.append(batch_embeddings)
    
    # 모든 배치를 하나의 텐서로 결합
    return torch.cat(embeddings, dim=0)
