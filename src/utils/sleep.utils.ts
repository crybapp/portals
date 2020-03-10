export default (sleepTimeMs: number) => new Promise(resolve => {
    setTimeout(() => resolve(true), sleepTimeMs)
})
