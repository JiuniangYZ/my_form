class compileHelper {
  constructor() {
    this.ctx = null; //theData  [][]
    this.rowNum = 0;
    this.colNum = 0;
  }
  funcCallBuilder(funcName, exp) {
    if (!["max", "min", "ave"].includes(funcName))
      throw new Error(`un supported function ${funcName}`);
    return { type: "funcCall", funcName, exp };
  }
  rowBuilder(text) {
    let index = Number(String(text).substr(1)) - 1;
    if (index >= this.rowNum) throw new Error(`row out of range`);
    //行序从1开始
    //这样正则表达式比较好写
    return { type: "row", index };
  }
  colBuilder(text) {
    let index =
      String(text)
        .substr(1)
        .charCodeAt(0) - 97;
    if (index >= this.colNum) throw new Error(`col out of range`);
    return { type: "col", index };
  }
  setCtx(ctx) {
    this.ctx = ctx;
    this.colNum = ctx[0].length;
    this.rowNum = ctx.length;
  }
  evalBuilder(left, op, right) {
    return { left, op, right, type: "eval" };
  }
  calcBuilder(left, right) {
    return { type: "calc", left, right };
  }
  cellBuilder(text) {
    let res = /^#([a-z])([1-9][0-9]*)$/.exec(text);
    let rowIndex = Number(res[2]) - 1;
    let colIndex = res[1].charCodeAt(0) - 97;
    if (colIndex >= this.colNum) throw new Error("col out of range");
    if (rowIndex >= this.rowNum) throw new Error("row out of range");
    return {
      type: "cell",
      rowIndex,
      colIndex
    };
  }
}

export let helper = compileHelper;
