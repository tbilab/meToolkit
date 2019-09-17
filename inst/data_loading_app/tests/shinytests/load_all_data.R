app <- ShinyDriver$new("../../")
app$snapshotInit("load_all_data")

app$uploadFile(`data_loader-phewas` = "../../../sample_data/phewas_results.csv") # <-- This should be the path to the file, relative to the app's tests/shinytests directory
app$uploadFile(`data_loader-genome` = "../../../sample_data/id_to_snp.csv") # <-- This should be the path to the file, relative to the app's tests/shinytests directory
app$uploadFile(`data_loader-phenome` = "../../../sample_data/id_to_phenome.csv") # <-- This should be the path to the file, relative to the app's tests/shinytests directory
app$snapshot()
