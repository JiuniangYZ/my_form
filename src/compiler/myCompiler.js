import { parser } from "./index_es6";
import { helper } from "./helper";

function average(...array) {
  return sum(...array) / array.length;
}

function sum(...array) {
  return array.reduce((old, i) => {
    return old + i;
  }, 0);
}

function spreader(left, right, cb) {
  let code = Array.isArray(left) * 1 + Array.isArray(right) * 2;
  //表示两个正交的boolean需要两个二进制位
  if (code == 0) return cb(left, right);
  if (code == 1) return left.map(i => cb(i, right)); //仅left为序列
  if (code == 2) return right.map(i => cb(left, i)); //仅right为数组
  return left.map((i, index) => cb(i, right[index]));
}

class myCompiler {
  constructor() {
    this._parser = parser;
    this._helper = new helper();
    this._parser.yy.helper = this._helper;
    this.ctx = null;
  }
  parse(ctx, code) {
    this._helper.setCtx(ctx);
    this.ctx = ctx;
    return this._parser.parse(code);
  }
  getExpVal(exp) {
    //based on the exp node and the context
    let { type } = exp;
    // cell| col| eval| row| funcCall
    if (type == "cell") return this.getCellVal(exp);
    if (type == "col") return this.getColVal(exp);
    if (type == "eval") return this.execEval(exp);
    if (type == "row") return this.getRowVal(exp);
    if (type == "funcCall") return this.evalFuncCall(exp);
    if (type == "number") return { _type: "number", val: exp.val };
    throw new Error(`[DEBUG]unknown node type => ${type}`);
  }
  getCellVal(node) {
    let { rowIndex, colIndex } = node;
    return {
      _type: "number",
      val: Number(this.ctx[rowIndex][colIndex].val)
    }; //just ret value
  }
  getColVal(node) {
    let { index } = node;
    return {
      _type: "col",
      val: this.ctx.map(r => Number(r[index].val) || 0)
    };
  }
  getRowVal(node) {
    let { index } = node;
    return {
      _type: "row",
      val: this.ctx[index].map(i => Number(i.val) || 0)
    };
  }
  evalFuncCall(node) {
    let { funcName, exp } = node;
    let { _type, val } = this.getExpVal(exp);
    if (!["col", "row"].includes(_type))
      throw new Error(`function ${funcName} can only be applied on Array`);
    if (funcName === "max")
      return {
        _type: "number",
        val: Math.max(...val)
      };
    if (funcName === "min")
      return {
        _type: "number",
        val: Math.min(...val)
      };
    if (funcName === "ave")
      return {
        _type: "number",
        val: average(...val)
      };
    if (funcName === "sum")
      return {
        _type: "number",
        val: sum(...val)
      };
    throw new Error(`[DEBUG] unknown func name ${funcName}`);
  }
  execEval(node) {
    let { left, op, right } = node;
    let { _type: lType, val: lVal } = this.getExpVal(left);
    let { _type: rType, val: rVal } = this.getExpVal(right);
    if (lType !== rType && lType !== "number" && rType !== "number")
      throw new Error(`val type does not match => ${lType} ${op} ${rType}`);
    //同类型天然可以运算
    //row 和 col不能一起运算
    //row或者col可以和number进行运算
    //当然数字之间自然是可以运算的
    let higherType = [lType, rType].sort((a, b) => {
      if (a == "number") return 1;
      if (b == "number") return -1;
      return 0;
    })[0];
    //尽可能把number排在后面 那么如果type1是number那么一定就是
    let _type = higherType === "number" ? "number" : higherType;
    if (op === "+")
      return {
        _type,
        val: spreader(lVal, rVal, (a, b) => a + b)
      };
    if (op === "-")
      return {
        _type,
        val: spreader(lVal, rVal, (a, b) => a - b)
      };
    if (op === "*")
      return {
        _type,
        val: spreader(lVal, rVal, (a, b) => a * b)
      };
    if (op === "/")
      return {
        _type,
        val: spreader(lVal, rVal, (a, b) => a / b)
      };
    throw new Error(`[DEBUG] unknown op ${op}`);
  }
}

export let Compiler = new myCompiler();
