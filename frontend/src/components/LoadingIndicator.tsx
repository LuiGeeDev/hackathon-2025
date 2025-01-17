import LoadingSpinner from "./LoadingSpinner";
import IconCheckSmallLine from "@/assets/icons/icon-check-small-line.svg";

export default function LoadingIndicator({
  children,
  loading,
}: {
  children: React.ReactNode;
  loading: boolean;
}) {
  const textClassName = loading
    ? "text-body2 text-primary"
    : "text-body2 text-gray-500";

  return (
    <li className="flex items-center">
      {loading ? (
        <LoadingSpinner className="mr-12" />
      ) : (
        <img src={IconCheckSmallLine} alt="" className="text-gray-500 mr-12" />
      )}
      <p className={textClassName}>{children}</p>
    </li>
  );
}
