export default function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      fill="none"
      className={className}
    >
      <g
        dangerouslySetInnerHTML={{
          __html: `<path class="circle" d="M14.25 9C14.25 11.8995 11.8995 14.25 9 14.25C6.10051 14.25 3.75 11.8995 3.75 9C3.75 6.10051 6.10051 3.75 9 3.75C11.8995 3.75 14.25 6.10051 14.25 9Z" stroke=#D4E5F9 stroke-width="1.5"/><path class="quarter" fill-rule="evenodd" clip-rule="evenodd" d="M9 13.5C11.4853 13.5 13.5 11.4853 13.5 9H15C15 9.50716 14.9357 10.0111 14.8095 10.5C14.7396 10.7707 14.6507 11.0367 14.5433 11.2961C14.2417 12.0241 13.7998 12.6855 13.2426 13.2426C12.6855 13.7998 12.0241 14.2417 11.2961 14.5433C11.0367 14.6507 10.7707 14.7396 10.5 14.8095C10.0111 14.9357 9.50716 15 9 15V13.5Z" fill=#2A7DE1><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 9 9" to="360 9 9" dur="1s" repeatCount="indefinite"/></path>`,
        }}
      />
    </svg>
  );
}
