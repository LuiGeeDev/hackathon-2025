import { FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

function App() {
  const [question, setQuestion] = useState("");
  const [details, setDetails] = useState<
    { title: string; question: string; answer: string; source: string }[] | null
  >(null);
  const [generatedAnswer, setGeneratedAnswer] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDetails(null);
    setGeneratedAnswer(null);

    // details 요청
    fetch("http://127.0.0.1:5000/api/question_details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_question: question }),
    })
      .then((res) => res.json())
      .then((data) => {
        setDetails(data.details);
      })
      .catch((error) => {
        console.error("Details Error:", error);
      });

    // generated_answer 스트리밍 요청
    fetch("http://127.0.0.1:5000/api/stream_generated_answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_question: question }),
    })
      .then(async (res) => {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder("utf-8");

        if (reader) {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            setGeneratedAnswer((prev) => (prev || "") + chunk);
          }
        }
      })
      .catch((error) => {
        console.error("Generated Answer Error:", error);
      });
  };

  return (
    <div className="p-21">
      <h1>질문하기</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="질문을 입력하세요"
          style={{ padding: "10px", width: "300px" }}
        />
        <button type="submit" style={{ padding: "10px", marginLeft: "10px" }}>
          제출
        </button>
      </form>

      {details && (
        <div style={{ marginTop: "20px" }}>
          <h2>유사 질문 목록:</h2>
          <ul>
            {details.map((detail, index) => (
              <li key={index}>
                <strong>{detail.title}</strong> - {detail.question} (출처:{" "}
                <a
                  href={detail.source}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  링크
                </a>
                )
              </li>
            ))}
          </ul>
        </div>
      )}

      {generatedAnswer && (
        <div style={{ marginTop: "20px" }}>
          <h2>생성된 답변:</h2>
          <ReactMarkdown
            className="prose max-w-none"
            rehypePlugins={[rehypeRaw]}
          >
            {replaceReferencesWithSpans(generatedAnswer)}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function replaceReferencesWithSpans(answer: string): string {
  return answer.replace(/\[(\d+)\]/g, (_, number) => {
    return `<span class="bg-gray-100 size-16 text-sm inline-flex items-center justify-center font-bold rounded-full mx-4">${number}</span>`;
  });
}

export default App;
