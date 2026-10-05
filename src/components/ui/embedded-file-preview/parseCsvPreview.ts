export interface CsvPreviewLimits {
  maxRows: number;
  maxColumns: number;
}

export interface CsvPreview {
  rows: string[][];
  truncated: boolean;
}

interface CsvParserState {
  rows: string[][];
  row: string[];
  cell: string;
  quoted: boolean;
  truncated: boolean;
}

function completeCell(state: CsvParserState, maxColumns: number) {
  if (state.row.length < maxColumns) state.row.push(state.cell);
  else state.truncated = true;
  state.cell = "";
}

function completeRow(state: CsvParserState, limits: CsvPreviewLimits) {
  completeCell(state, limits.maxColumns);
  if (state.rows.length < limits.maxRows) state.rows.push(state.row);
  else state.truncated = true;
  state.row = [];
}

function consumeQuotedCharacter(
  text: string,
  index: number,
  state: CsvParserState,
): number {
  if (text[index] !== '"') {
    state.cell += text[index];
    return index;
  }
  if (text[index + 1] === '"') {
    state.cell += '"';
    return index + 1;
  }
  state.quoted = false;
  return index;
}

export function parseCsvPreview(
  text: string,
  limits: CsvPreviewLimits,
): CsvPreview {
  // Cases: empty input, quoted delimiters, escaped quotes, CRLF/LF, and capped rows/columns.
  const state: CsvParserState = {
    rows: [],
    row: [],
    cell: "",
    quoted: false,
    truncated: false,
  };
  for (let index = 0; index < text.length; index += 1) {
    if (state.quoted) {
      index = consumeQuotedCharacter(text, index, state);
    } else if (text[index] === '"' && state.cell === "") state.quoted = true;
    else if (text[index] === ",") completeCell(state, limits.maxColumns);
    else if (text[index] === "\n") completeRow(state, limits);
    else if (text[index] !== "\r") state.cell += text[index];
  }
  if (state.cell || state.row.length) completeRow(state, limits);
  return { rows: state.rows, truncated: state.truncated };
}
