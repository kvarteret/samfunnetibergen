type AsyncTask = () => Promise<void>

export function createCoalescedAsyncRunner() {
  let activeOperation: Promise<void> | null = null
  let runAgain = false
  let latestTask: AsyncTask | null = null

  return (task: AsyncTask): Promise<void> => {
    latestTask = task
    if (activeOperation) {
      runAgain = true
      return activeOperation
    }

    const operation = (async () => {
      do {
        runAgain = false
        const currentTask = latestTask
        if (currentTask) await currentTask()
      } while (runAgain)
    })()
    const trackedOperation = operation.finally(() => {
      if (activeOperation === trackedOperation) activeOperation = null
    })
    activeOperation = trackedOperation
    return trackedOperation
  }
}
