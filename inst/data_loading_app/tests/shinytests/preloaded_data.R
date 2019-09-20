app <- ShinyDriver$new("../../")
app$snapshotInit("preloaded_data")

app$snapshot()
app$setInputs(`data_loader-preLoadedData` = "click")
app$snapshot()
