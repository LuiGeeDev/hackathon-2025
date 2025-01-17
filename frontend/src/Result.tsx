import logo from "@/assets/comento-pick-logo.svg";
import pickLogo from "@/assets/pick-logo.svg";
import placeholderAvatar from "@/assets/placeholder-avatar.svg";
import IconSearchLargeLine from "@/assets/icons/icon-search-large-line.svg";
import IconArrowMediumLine from "@/assets/icons/icon-arrow-medium-line.svg";
import IconNextSmallLine from "@/assets/icons/icon-next-small-line.svg";
import IconNextSmallLineBlue from "@/assets/icons/icon-next-small-line-blue.svg";
import IconCheckRoundXSmallFill from "@/assets/icons/icon-checkRound-xsmall-fill.svg";
import { Link, useNavigate, useParams } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import FirstSource from "./components/FirstSource";
import OtherSource from "./components/OtherSource";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import * as HoverCard from "@radix-ui/react-hover-card";
import { range } from "./utils";
import LoadingIndicator from "./components/LoadingIndicator";
import thumbnail from "@/assets/thumbnail.png";

export default function Result() {
  const params = useParams();
  const navigate = useNavigate();
  const [isProgressFolded, setIsProgressFolded] = useState(false);
  const {
    sourceAnswers,
    isFinished: isSourceAnswerLoaded,
    reset: resetSourceAnswers,
  } = useSourceAnswers();
  const {
    generatedAnswer,
    isFinished,
    reset: resetGeneratedAnswer,
  } = useGeneratedAnswer(sourceAnswers);
  const sideBoxRef = useSideBoxScroll();

  function handleSubmitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = formData.get("search") as string;
    if (search.length === 0) {
      return;
    }

    resetGeneratedAnswer();
    resetSourceAnswers();
    navigate(`/${encodeURIComponent(search)}`);
  }

  const searchText =
    (params.slug?.length ?? 0 <= 20)
      ? params.slug
      : params.slug?.slice(0, 20) + "...";

  const relatedQuestions = [
    "현대자동차 연구개발 직군 이직 고민입니다.",
    "같은 회사 다른 직무에 지원해도 될까요?",
    "삼성전자 DS부문 공정기술 스펙에서 추가해야 할 점 조언 부탁드립니다",
    "면접보고 일주일 뒤 채용검진 받으라는 메일을 보고",
    "반도체 계열 체험형 인턴 면접 관련 질문 있습니다!",
    "만25살 여 본격적인 첫 인턴과 취준 시작하기 너무 늦은 나이 일까요?",
    "[직무 고민] 삼성디스플레이 공정기술 vs 분석기술",
    "안녕하세요 올해 하반기 TEL 준비하는 학생입니다.",
    "반도체 공정 중 어느 쪽이 제일 커리어에 좋을까요?",
  ];

  const randomQuestions = relatedQuestions
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white">
        <nav className="h-68">
          <div
            className="grid px-16 grid-cols-12 gap-x-24 mx-auto h-full"
            style={{ maxWidth: 1140 }}
          >
            <div className="col-span-12 flex items-center">
              <Link to="/">
                <img src={logo} alt="" width={144} />
              </Link>
              <img className="ml-auto" src={placeholderAvatar} alt="" />
            </div>
          </div>
        </nav>
        <div className="h-1 bg-gray-100" />
      </header>
      <nav className="sticky top-69 z-10 bg-white">
        <div
          className="grid px-16 grid-cols-12 gap-x-24 mx-auto h-62"
          style={{ maxWidth: 1140 }}
        >
          <form
            className="col-span-12 flex items-center"
            onSubmit={handleSubmitSearch}
          >
            <img src={IconSearchLargeLine} alt="" className="size-24" />
            <input
              className="text-gray-900 font-600 text-headline7 ml-10 grow outline-none"
              type="text"
              name="search"
              defaultValue={params.slug}
              placeholder="검색어를 입력해주세요."
            />
          </form>
        </div>
        <div className="h-1 bg-gray-200" />
      </nav>
      <main
        className="pt-40 grid px-16 grid-cols-12 gap-x-24 mx-auto mb-48"
        style={{ maxWidth: 1140 }}
      >
        <div className="col-span-12 flex gap-x-42">
          <div style={{ width: 690 }}>
            <div
              className="rounded-16 py-14 px-16 bg-gray-100 overflow-y-hidden"
              style={{ height: isProgressFolded ? 53 : "auto" }}
            >
              <div className="flex items-center mb-12">
                <p className="text-body1 text-gray-850 font-600 ml-4">
                  답변을 생성하고 있어요.
                </p>
                <button
                  className="ml-auto"
                  onClick={() => setIsProgressFolded(!isProgressFolded)}
                >
                  <img
                    className={isProgressFolded ? "transform rotate-180" : ""}
                    src={IconArrowMediumLine}
                    alt=""
                  />
                </button>
              </div>
              <div className="bg-white p-20 rounded-12">
                <ol className="space-y-8">
                  <LoadingIndicator loading={!isSourceAnswerLoaded}>
                    '{searchText}' 현직자 답변 데이터 가져오는 중
                  </LoadingIndicator>
                  {isSourceAnswerLoaded && (
                    <LoadingIndicator loading={!isFinished}>
                      현직자 답변 데이터를 기반으로 Ai 답변 생성 중
                    </LoadingIndicator>
                  )}
                  {isSourceAnswerLoaded && isFinished && (
                    <LoadingIndicator loading={false}>
                      답변 생성 완료!
                    </LoadingIndicator>
                  )}
                </ol>
              </div>
            </div>
            <ReactMarkdown
              className="prose max-w-none my-32"
              rehypePlugins={[rehypeRaw]}
              components={{
                span(props) {
                  const { children } = props;
                  const answer =
                    sourceAnswers?.[parseInt(children as string) - 1];
                  const answerTitle =
                    (answer?.title.length ?? 0 > 14)
                      ? answer?.title.slice(0, 14) + "..."
                      : answer?.title;
                  return (
                    <HoverCard.Root openDelay={0} closeDelay={100}>
                      <HoverCard.Trigger asChild>
                        <span className="bg-[#6da2f5] size-20 text-caption2 font-600 text-white inline-flex items-center justify-center font-bold rounded-full mx-4 cursor-pointer">
                          {children}
                        </span>
                      </HoverCard.Trigger>
                      <HoverCard.Portal>
                        <HoverCard.Content
                          align="start"
                          sideOffset={4}
                          className="group shadow-2 bg-white rounded-12 border border-gray-200 py-12 px-16 cursor-pointer hover:bg-gray-050"
                          style={{ width: 286 }}
                        >
                          <a href={answer?.source} target="_blank">
                            <header>
                              <p className="text-body1">
                                <span className="font-600 text-primary">
                                  {answer?.company} 현직자
                                </span>
                                가 답변했어요.
                              </p>
                            </header>
                            <div className="h-1 bg-gray-200 my-8" />
                            <main>
                              <p className="mb-8 text-body2 font-600 text-gray-800 line-clamp-3">
                                {answer?.answer}
                              </p>
                              <p className="text-caption1 text-gray-500 group-hover:underline">
                                "{answerTitle}" 질문 자세히 보기
                              </p>
                            </main>
                          </a>
                        </HoverCard.Content>
                      </HoverCard.Portal>
                    </HoverCard.Root>
                  );
                },
              }}
            >
              {replaceReferencesWithSpans(generatedAnswer || "")}
            </ReactMarkdown>
            <div className="h-1 bg-gray-200 my-36" />
            {isFinished && (
              <div>
                <p className="mb-14 text-body1 text-gray-900 font-600">
                  이런 질문은 어떤가요?
                </p>
                <ul className="flex gap-8">
                  {randomQuestions.map((question, index) => (
                    <li key={index} className="flex-1">
                      <Link
                        to={`/${encodeURIComponent(question)}`}
                        className="block p-12 rounded-8 bg-blue-000 text-gray-800 text-body2 hover:bg-blue-100 min-h-84"
                      >
                        <p className="line-clamp-3">
                          <span className="text-blue-400 font-600">Q. </span>
                          {question}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {isFinished && (
              <div className="mt-32 border border-gray-200 rounded-16 cursor-pointer">
                <div className="p-16 pb-20 flex items-center">
                  <div>
                    <p className="text-body2">
                      <img
                        src="https://picsum.photos/24/24"
                        className="rounded-full inline"
                        alt=""
                      />
                      <span className="ml-8 mr-4 font-600">JSL</span>
                      <span className="text-gray-500">현직자 멘토</span>
                      <img
                        className="inline ml-2"
                        src={IconCheckRoundXSmallFill}
                        alt=""
                      />
                    </p>
                    <p className="mt-6 text-body2">
                      안녕하세요, 닉네임은한글최대열자님. <br />
                      저는 JSL 멘토예요. {searchText?.split(" ")[0]} 직무의
                      실무가 궁금하신가요?
                    </p>
                  </div>
                  <img className="ml-auto rounded-8" src={thumbnail} alt="" />
                </div>
                <div className="h-1 bg-gray-200"></div>
                <div className="px-16 py-12 text-caption1 text-primary font-600 flex items-center">
                  현직자와 5주간 {searchText?.split(" ")[0]} 직무 실무 체험하기
                  <img
                    src={IconNextSmallLineBlue}
                    alt=""
                    className="inline ml-auto"
                  />
                </div>
              </div>
            )}
          </div>
          <div style={{ width: 376 }} className="relative">
            <div ref={sideBoxRef} className="absolute w-full">
              <div className="border border-gray-200 border-b-0 rounded-t-16 p-20">
                <h2 className="ml-8 text-headline7 font-600 text-gray-850 flex items-center mb-12">
                  출처 답변{" "}
                  <img className="inline-block ml-8" src={pickLogo} alt="" />
                </h2>
                <ol className="space-y-12">
                  {sourceAnswers?.map((answer, index) =>
                    index === 0 ? (
                      <FirstSource key={index} answer={answer} />
                    ) : (
                      <OtherSource
                        key={index}
                        answer={answer}
                        order={index + 1}
                      />
                    )
                  )}
                  {!sourceAnswers &&
                    range(3).map((index) => (
                      <li
                        key={index}
                        className="h-150 animate-pulse bg-gray-200 rounded-8"
                      />
                    ))}
                </ol>
              </div>
              <div className="h-1 bg-gray-200" />
              <div className="border border-gray-200 border-t-0 rounded-b-16">
                <a
                  href="https://qa.danish.pe.kr/job-questions"
                  className="px-20 py-10 text-body1 text-gray-700 flex items-center justify-center"
                >
                  유사 질문 답변 더보기
                  <img src={IconNextSmallLine} alt="" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function useSourceAnswers() {
  const question = useQuestionFromParams();
  const [sourceAnswers, setSourceAnswers] = useState<
    | {
        title: string;
        question: string;
        answer: string;
        source: string;
        similarity: number;
        company: string;
      }[]
    | null
  >(null);
  const isFinished = sourceAnswers !== null;

  useEffect(() => {
    const fetchSourceAnswers = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/question_details`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_question: question }),
          }
        );
        const data = await response.json();
        setSourceAnswers(data.details.slice(0, 3));
      } catch (error) {
        console.error("Details Error:", error);
      }
    };

    fetchSourceAnswers();
  }, [question]);

  const reset = useCallback(() => {
    setSourceAnswers(null);
  }, []);

  return { sourceAnswers, isFinished, reset };
}

function useQuestionFromParams() {
  const params = useParams();
  return params.slug;
}

function useGeneratedAnswer(
  sourceAnswers: ReturnType<typeof useSourceAnswers>["sourceAnswers"]
) {
  const question = useQuestionFromParams();
  const [generatedAnswer, setGeneratedAnswer] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    window.scrollTo({
      top: document.body.scrollHeight, // 문서의 맨 아래로 스크롤
      behavior: "smooth", // 부드럽게 스크롤
    });
  }, [generatedAnswer]);

  useEffect(() => {
    const fetchGeneratedAnswer = async () => {
      if (true) {
        return;
      }
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/stream_generated_answer`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_question: question }),
          }
        );

        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");

        if (reader) {
          for await (const chunk of readStream(reader, decoder)) {
            setGeneratedAnswer((prev) => (prev || "") + chunk);
          }
        }
        setIsFinished(true);
      } catch (error) {
        console.error("Generated Answer Error:", error);
      }
    };

    if (sourceAnswers === null) {
      return;
    }
    fetchGeneratedAnswer();
  }, [question, sourceAnswers]);

  const reset = useCallback(() => {
    setGeneratedAnswer(null);
    setIsFinished(false);
  }, []);

  return {
    generatedAnswer,
    isFinished,
    reset,
  };
}

function replaceReferencesWithSpans(answer: string): string {
  return answer.replace(/\[(\d+)\]/g, (_, number) => {
    return `<span>${number}</span>`;
  });
}

// Helper 함수: ReadableStream을 처리하는 비동기 이터레이터
async function* readStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder
) {
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}

function useSideBoxScroll() {
  const sideBoxRef = useRef<HTMLDivElement>(null);
  const originalTop = useRef(0);

  useEffect(() => {
    originalTop.current = sideBoxRef.current?.getBoundingClientRect().top ?? 0;
  }, []);

  useEffect(() => {
    function handleScroll() {
      requestAnimationFrame(() => {
        if (!sideBoxRef.current) {
          return;
        }

        sideBoxRef.current.style.top = window.scrollY + "px";
      });
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return sideBoxRef;
}
