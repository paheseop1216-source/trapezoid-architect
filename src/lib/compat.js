/* 오래된 아이패드(iPadOS 15.3 이하) 대비
   structuredClone이 없으면 버튼을 눌러도 아무 일도 안 일어나요 → JSON 복사로 대신해요.
   (이 앱의 상태는 숫자·문자열·배열·객체뿐이라 JSON으로 충분해요) */
if (typeof window !== 'undefined' && typeof window.structuredClone !== 'function') {
  window.structuredClone = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
}
