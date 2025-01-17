import backgroundImage from "@/assets/main-background.png";
import logo from "@/assets/comento-pick-logo.svg";
import IconSearchLargeLine from "@/assets/icons/icon-search-large-line.svg";
import IconSend2xLargeFill from "@/assets/icons/icon-send-2xlarge-fill.svg";
import { Link, useNavigate } from "react-router";

export default function Landing() {
  const navigate = useNavigate();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = formData.get("search") as string;
    if (search.length === 0) {
      return;
    }
    navigate(`/${encodeURIComponent(search)}`);
  }

  return (
    <div
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
      className="h-screen bg-cover bg-center bg-no-repeat"
    >
      <div className="size-full flex flex-col justify-center items-center">
        <Link to="/">
          <img className="mb-36" src={logo} alt="" />
        </Link>
        <form
          className="border border-primary px-10 py-8 flex items-center"
          style={{ width: 628, borderRadius: 120 }}
          onSubmit={handleSubmit}
        >
          <img className="ml-12" src={IconSearchLargeLine} alt="" />
          <input
            type="text"
            name="search"
            className="ml-10 placeholder:text-gray-400 outline-none text-gray-850 grow"
            placeholder="어떤 직무가 궁금하신가요?"
          />
          <button className="bg-primary rounded-full size-42 flex items-center justify-center ml-20">
            <img src={IconSend2xLargeFill} alt="" />
          </button>
        </form>
        <p className="text-gray-400 font-500 mt-16">
          24만개의 현직자 답변을 모아 내 고민에 대한 맞춤형 답변 어쩌고
        </p>
      </div>
    </div>
  );
}
