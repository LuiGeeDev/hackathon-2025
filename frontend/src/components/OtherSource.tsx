export default function OtherSource({
  answer,
  order,
}: {
  answer: {
    title: string;
    answer: string;
    source: string;
    company: string;
  };
  order: number;
}) {
  return (
    <li>
      <a
        href={answer.source}
        className="block bg-gray-100 py-12 px-16 rounded-8 hover:bg-gray-200"
        target="_blank"
      >
        <header className="flex items-center text-body1 font-600 text-gray-800 line-clamp-1 text-ellipsis">
          <span className="mr-8 shrink-0 inline-flex items-center justify-center size-20 bg-[#6da2f5] rounded-full text-white text-caption2 font-600">
            {order}
          </span>
          <span className="text-ellipsis line-clamp-1">{answer.title}</span>
        </header>
        <div className="h-1 bg-gray-200 my-8" />
        <article>
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
        </article>
      </a>
    </li>
  );
}
