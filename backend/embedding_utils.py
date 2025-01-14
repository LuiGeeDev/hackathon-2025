import torch
from transformers import AutoTokenizer, AutoModel

# 모델 로드
MODEL_NAME = 'BM-K/KoSimCSE-roberta-multitask'
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModel.from_pretrained(MODEL_NAME)

# Mean Pooling 함수
def mean_pooling(model_output, attention_mask):
    """
    모델 출력과 attention mask를 기반으로 mean pooling을 수행하여 임베딩 생성.
    """
    token_embeddings = model_output.last_hidden_state
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size())
    return torch.sum(token_embeddings * input_mask_expanded, dim=1) / torch.clamp(input_mask_expanded.sum(dim=1), min=1e-9)

# 텍스트 임베딩 생성 함수
def generate_embeddings(texts):
    """
    텍스트 리스트를 입력받아 임베딩 벡터를 생성.
    """
    encoded_input = tokenizer(texts, padding=True, truncation=True, return_tensors='pt', max_length=512)
    with torch.no_grad():
        model_output = model(**encoded_input)
    embeddings = mean_pooling(model_output, encoded_input['attention_mask'])
    return embeddings
