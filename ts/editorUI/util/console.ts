
const logger = function (logFunc :(message?: any, ...optionalParams: any[]) => void ,loggerTagList : string[] = []) {
    return function () {
        if (!(process.env.NODE_ENV === 'development')) {
            return;
        }

        let inputStr = arguments[0]
        if(typeof inputStr !== 'string'){
            logFunc.call(console, ...arguments)
            return;
        }
        
        inputStr = inputStr.match(/\[.*]/);// Get [XXX]
        // console.log(inputStr)

        if(inputStr == null){
            logFunc.call(console, ...arguments)
            return;
        }

        inputStr = inputStr[0] as string;
        inputStr = inputStr.substr(1,inputStr.length - 2)

        if(loggerTagList.includes(inputStr))
            logFunc.call(console, ...arguments)

    }
}
// export var consoleLogList : string[] = ["DEB", "EUI", "MOD"];
// export var consoleLogList : string[] = ["TBR", "HOK"];
// export var consoleLogList : string[] = ["STA", "HOK", "EUI", /* "CVS" */];
export var consoleLogList : string[] = ["DEB"];
console.log = logger(console.log,consoleLogList)
export var consoleErrorList : string[] = ["HOK"];
console.error = logger(console.error,consoleErrorList)
export var consoleInfoList : string[] = [];
console.info = logger(console.info,consoleInfoList)


