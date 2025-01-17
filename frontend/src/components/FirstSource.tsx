export default function FirstSource({
  answer,
}: {
  answer: {
    title: string;
    question: string;
    answer: string;
    source: string;
    company: string;
    similarity: number;
  };
}) {
  return (
    <li>
      <a
        href={answer.source}
        className="block bg-blue-000 py-12 px-16 rounded-8 hover:bg-blue-050"
        target="_blank"
      >
        <header className="-mx-16 -mt-12 py-10 px-16 border border-primary rounded-8 bg-white flex items-center text-body1 font-600 text-gray-800">
          <span className="shrink-0 mr-8 inline-flex items-center justify-center size-20 bg-[#6da2f5] rounded-full text-white text-caption2 font-600">
            1
          </span>
          <span className="text-ellipsis line-clamp-1">{answer.title}</span>
        </header>
        <article className="mt-16">
          <p className="mb-8 flex items-center text-body2 font-600">
            <img
              src="https://picsum.photos/24/24"
              alt=""
              className="rounded-full mr-8"
              width={24}
              height={24}
            />
            {answer.company} 현직자
            <span className="text-gray-500 font-400">의 답변</span>
          </p>
          <p className="text-body2 text-gray-700 line-clamp-2">
            {answer.answer}
          </p>
          <div className="mt-12 bg-white py-6 px-12 rounded-8 flex items-center text-caption1 text-primary font-600">
            <p className="font-600 text-primary">
              이 질문의 내용과 가장 비슷했어요!
            </p>
            <span className="ml-auto mr-4 text-gray-700 font-400">유사율</span>{" "}
            {Math.round(answer.similarity * 100)}%
          </div>
        </article>
      </a>
    </li>
  );
}
