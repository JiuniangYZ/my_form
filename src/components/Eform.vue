<script>
import { Compiler } from "../compiler/myCompiler";
let mousetrap = require("mousetrap");
const SELECT_NONE = 0;
const SELECT_BY_ROW = 1;
const SELECT_BY_COL = 2;
const SELECT_SINGLE_CELL = 3;
const NORMAL_MODE = 1;
// 普通模式的操作面向单个单元格
// 开始单元格编辑后即退出普通模式
const EDIT_MODE = 2;
//实际编辑某一个特定单元格的模式
//相当于vim中的编辑模式
const COMMAND_MODE = 3;
//输入复杂指令的模式
//几种典型的编辑操作
const INSERT_ROW = 0;
const INSERT_COL = 1;
const RM_ROW = 2;
const RM_COL = 3;
const RERANGE_ROW = 4; //包括sort
const CELL_EDIT = 5;
//剪贴板类型
const NONE = 0;
const ROW = 1;
const COL = 2;
const CELL = 3;
export default {
  data() {
    return {
      commandStatus: {
        mode: NORMAL_MODE,
        command: "",
      },
      editStatus: {
        editting: false,
        row_index: 0,
        col_index: 0,
      },
      selectStatus: {
        type: SELECT_SINGLE_CELL,
        selectedRow: 0,
        selectedCol: 0,
      },
      editStack: [],
      theData: [
        [{ val: 1 }, { val: 2 }, { val: 3 }],
        [{ val: 4 }, { val: 5 }, { val: 6 }],
        [{ val: 7 }, { val: 8 }, { val: 9 }],
      ],
      cutBoard: {
        type: NONE,
        val: null,
      },
      maxCol: 3,
      maxRow: 3,
    };
  },
  methods: {
    headerRender() {
      return <a-row class={{ the_header: true }}>I am header</a-row>;
    },
    firstRowRender() {
      let { maxCol } = this;
      return (
        <tr>
          <th class={{ corner: true }}></th>
          {new Array(maxCol).fill(0).map((i, index) => {
            return (
              <th
                class={{ column_head: true, side_blk: true }}
                on-click={() => {
                  this.selectCol(index);
                }}
              >
                {String.fromCharCode(index + 97)}
                <a-popover class="col_action">
                  <a-icon type="caret-down" />
                  <template slot="content">
                    <a-row>
                      <a-button
                        on-click={() => {
                          this.addColumnAfter(index);
                        }}
                      >
                        增加一列
                      </a-button>
                    </a-row>
                    <a-row>
                      <a-button
                        on-click={() => {
                          this.removeColumn(index);
                        }}
                      >
                        删除当前列
                      </a-button>
                    </a-row>
                    <a-row>
                      <a-button
                        on-click={() => {
                          this.sortByCol(index);
                        }}
                      >
                        按当前列排序
                      </a-button>
                    </a-row>
                  </template>
                </a-popover>
              </th>
            );
          })}
        </tr>
      );
    },
    cellRender(cell, cellIndex, rowIndex) {
      let { editting, row_index, col_index } = this.editStatus;
      return (
        <td>
          {editting && row_index == rowIndex && col_index == cellIndex ? (
            <a-input
              key={cellIndex}
              value={cell.val}
              ref={`input_${rowIndex}_${cellIndex}`}
              on-blur={(e) => {
                console.log("blur!!!");
                this.selectStatus.type = SELECT_SINGLE_CELL;
                this.editStatus.editting = false;
                let val = e.target.value;
                let tryNum = Number(val);
                let oldVal = cell.val;
                this.editStack.push({
                  type: CELL_EDIT,
                  cell,
                  oldVal,
                });
                console.log("old => ", oldVal);
                if (typeof tryNum == "number" && !Number.isNaN(tryNum))
                  return (cell.val = Number(val));
                cell.val = val;
              }}
              on-focus={() => {}}
              class={{
                cell: true,
                cell_editting: this.isEditting(rowIndex, cellIndex),
              }}
            />
          ) : (
            <div
              class={{
                cell: true,
                cell_selected: this.isSelected(rowIndex, cellIndex),
              }}
              on-click={(e) => {
                this.handleCellClick(cell, rowIndex, cellIndex, e);
              }}
            >
              {cell.val}
            </div>
          )}
        </td>
      );
    },
    tableRender() {
      let { theData } = this;
      return (
        <table class="table_wrapper">
          {this.firstRowRender()}
          {/*this.contentRender()*/}
          {theData.map((row, rowIndex) => {
            return (
              <tr class={{ table_row: true }} key={rowIndex}>
                <td
                  on-click={() => {
                    this.selectRow(rowIndex);
                  }}
                  class={{ corner: true, side_blk: true }}
                >
                  {rowIndex + 1}
                </td>
                {row.map((cell, cellIndex) => {
                  return this.cellRender(cell, cellIndex, rowIndex);
                })}
              </tr>
            );
          })}
        </table>
      );
    },
    isEditting(rowIndex, colIndex) {
      let { editting, row_index, col_index } = this.editStatus;
      return editting && row_index == rowIndex && col_index == colIndex;
    },
    isSelected(rowIndex, colIndex) {
      if (this.editStatus.editting) return false; //编辑状态优先
      let _ = this.selectStatus;
      if (_.type == SELECT_NONE) return false;
      if (_.type == SELECT_BY_COL && colIndex == _.selectedCol) return true;
      if (_.type == SELECT_BY_ROW && rowIndex == _.selectedRow) return true;
      if (
        _.type == SELECT_SINGLE_CELL &&
        colIndex == _.selectedCol &&
        rowIndex == _.selectedRow
      )
        return true;
      return false;
    },
    selectRow(rowIndex) {
      let _ = this.selectStatus;
      _.type = SELECT_BY_ROW;
      _.selectedRow = rowIndex;
    },
    selectCol(colIndex) {
      let _ = this.selectStatus;
      _.type = SELECT_BY_COL;
      _.selectedCol = colIndex;
    },
    handleCellClick(cell, rowIndex, colIndex) {
      let { type, selectedCol, selectedRow } = this.selectStatus;
      if (
        type == SELECT_SINGLE_CELL &&
        selectedCol == colIndex &&
        selectedRow == rowIndex
      )
        return this.goEditCell(rowIndex, colIndex);
      this.goSelectCell(rowIndex, colIndex);
    },
    goEditCell(rowIndex, colIndex) {
      let info = this.editStatus;
      info.editting = true;
      info.row_index = rowIndex;
      info.col_index = colIndex;
      this.$nextTick(() => {
        // console.log(this.$refs);
        this.$refs[`input_${rowIndex}_${colIndex}`].focus();
        let el = this.$refs[`input_${rowIndex}_${colIndex}`].$el;
        let sub = mousetrap(el);
        sub.bind("esc", () => {
          console.log("esc here~");
          this.editStatus.editting = false;
        });
      });
    },
    goSelectCell(rowIndex, colIndex) {
      this.editStatus.editting = false;
      let info = this.selectStatus;
      info.type = SELECT_SINGLE_CELL;
      info.selectedRow = rowIndex;
      info.selectedCol = colIndex;
      // console.log("info=>", info);
    },
    addColumnAfter(colIndex) {
      // console.log(colIndex);
      this.theData.forEach((row) => {
        row.splice(colIndex + 1, 0, { val: row[colIndex].val });
      });
      this.maxCol += 1;
      this.editStack.push({
        type: INSERT_COL,
        colIndex: colIndex + 1, //新列的位置
      });
    },
    removeColumn(colIndex) {
      // console.log(colIndex);
      let { selectStatus } = this;
      let removed = this.theData.map((row) => {
        return row.splice(colIndex, 1)[0];
      });
      this.editStack.push({
        type: RM_COL,
        removed,
        index: colIndex,
      });
      this.maxCol -= 1;
      if (selectStatus.selectedCol == this.maxCol)
        selectStatus.selectedCol -= 1;
    },
    sortByCol(colIndex) {
      // console.log("sort by ", colIndex);
      let { theData } = this;
      let old = [...theData];
      this.editStack.push({
        type: RERANGE_ROW,
        old,
      });
      theData.sort((a, b) => {
        let _a = String(a[colIndex].val);
        let _b = String(b[colIndex].val);
        // console.log("_a=>", _a, "_b=>", _b);
        if (_a < _b) return -1;
        if (_a > _b) return 1;
        return 0;
      });
      this.$set(this, "theData", theData);
    },
    handleRight() {
      let { selectStatus: _ } = this;
      if (_.selectedCol == this.maxCol - 1) return;
      _.selectedCol += 1;
    },
    handleLeft() {
      let { selectStatus: _ } = this;
      if (_.selectedCol == 0) return;
      _.selectedCol -= 1;
    },
    handleUp() {
      let { selectStatus: _ } = this;
      if (_.selectedRow == 0) return;
      _.selectedRow -= 1;
    },
    handleDown() {
      let { selectStatus: _ } = this;
      if (_.selectedRow == this.maxRow - 1) return;
      _.selectedRow += 1;
    },
    removeRow(rowIndex) {
      console.log("dd!");
      if (this.maxRow == 1) return; //不能删除最后一行
      let removed = this.theData.splice(rowIndex, 1);
      let { cutBoard, selectStatus } = this;
      this.editStack.push({
        type: RM_ROW,
        rowIndex: rowIndex,
        val: removed[0],
      });
      this.maxRow -= 1;
      if (selectStatus.selectedRow == this.maxRow)
        selectStatus.selectedRow -= 1;
      cutBoard.type = ROW;
      cutBoard.val = removed[0];
    },
    copyRow(rowIndex) {
      console.log("yy!");
      this.cutBoard = {
        type: ROW,
        val: this.theData[rowIndex],
        //会在实际copy的时候进行深拷贝
      };
    },
    pasteRow(rowIndex) {
      console.log("paste!");
      let { cutBoard } = this;
      if (cutBoard.type != ROW) return; //剪贴板里空的
      this.theData.splice(rowIndex + 1, 0, this.deepCpy(cutBoard.val));
      this.maxRow += 1;
      this.editStack.push({
        type: INSERT_ROW,
        rowIndex: rowIndex + 1, //this is the rowIndex of the newly injected row
      });
    },
    deepCpy(data) {
      if (Array.isArray(data))
        //现在只支持行|单元格 不支持矩阵
        return data.map((d) => {
          return { val: d.val };
        });
      return { val: data.val };
    },
    revoke() {
      console.log("revoke!!");
    },
    handleEsc() {
      //类似vim中的esc逻辑
      let _ = this.commandStatus;
      _.mode = NORMAL_MODE;
      _.command = "";
    },
    go2EditMode() {
      let _ = this.commandStatus;
      _.mode = EDIT_MODE;
    },
    goCommandMode() {
      let _ = this.commandStatus;
      _.mode = COMMAND_MODE;
      this.$nextTick(() => {
        let el = this.$refs.script_input.$el;
        this.$refs.script_input.$el.focus();
        mousetrap(el).bind("esc", () => {
          console.log("esc__here__");
          this.handleEsc();
          _.command = "";
        });
      });
    },
    bindGlobalKeys() {
      mousetrap.bind("d d", () => {
        this.removeRow(this.selectStatus.selectedRow);
      });
      mousetrap.bind("y y", () => {
        this.copyRow(this.selectStatus.selectedRow);
      });
      mousetrap.bind("p", () => {
        this.pasteRow(this.selectStatus.selectedRow);
      });
      mousetrap.bind("u", () => {
        this.revoke();
      });
      mousetrap.bind("esc", () => {
        console.log("cancel");
        this.handleEsc();
      });
      mousetrap.bind("right", () => {
        console.log("=>");
        this.handleRight();
      });
      mousetrap.bind("left", () => {
        this.handleLeft();
        console.log("<=");
      });
      mousetrap.bind("up", () => {
        console.log("up!");
        this.handleUp();
      });
      mousetrap.bind("down", () => {
        console.log("down");
        this.handleDown();
      });
      mousetrap.bind(":", () => {
        this.goCommandMode();
      });
    },
    bottomRender() {
      //命令输入区
      let { commandStatus: _ } = this;
      if (_.mode != COMMAND_MODE) return "";
      return (
        <a-row>
          <a-input
            ref="script_input"
            v-model={_.command}
            on-blur={() => {
              this.handleEsc();
            }}
            on-pressEnter={() => {
              let code = _.command.substr(1);
              console.log(_.command);
              let ast = Compiler.parse(this.theData, code);
              let { right } = ast;
              console.log(right);
              console.log(Compiler.getExpVal(right));
            }}
          />
        </a-row>
      );
    },
  },
  mounted() {
    this.bindGlobalKeys();
  },
  render() {
    return (
      <div class="e_form_wrapper">
        {this.headerRender()}
        {this.tableRender()}
        {this.bottomRender()}
      </div>
    );
  },
};
</script>

<style lang="less">
.e_form_wrapper {
  .cell {
    height: 32px;
    width: 100px;
    border: 1px grey solid;
    cursor: pointer;
    line-height: 32px;
  }
  .cell_editting {
  }
  .ant-input {
    border: 1px grey solid;
    text-align: center;
    border-radius: 0;
    &:focus {
      text-align: left;
    }
  }
  .the_header {
    width: 100%;
    border: 1px grey solid;
    margin-bottom: 5px;
  }
  width: 100%;
  height: 100px;
  padding: 20px;
  .table_wrapper {
    border: 1px solid grey;
  }
  .corner {
    width: 50px;
    border: 1px solid grey;
  }
  .column_head {
    width: 80px;
    text-align: center;
    border: 1px solid grey;
    position: relative;
    .col_action {
      position: absolute;
      right: 5px;
      top: 5px;
    }
  }
  .cell_selected {
    background: #888888;
    border: 2px black solid;
  }
  .side_blk {
    cursor: pointer;
    &:hover {
      background: #888888;
    }
  }
}
</style>
