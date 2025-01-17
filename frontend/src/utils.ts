export function range(start: number, end?: number, step = 1) {
  if (end !== undefined && start > end) {
    throw new Error("시작 숫자가 종료 숫자보다 작아야 합니다.");
  }

  const output = [];
  let newEnd;
  let newStart;

  if (typeof end === "undefined") {
    newEnd = start;
    newStart = 0;
  } else {
    newEnd = end;
    newStart = start;
  }

  for (let i = newStart; i < newEnd; i += step) {
    output.push(i);
  }

  return output;
}
