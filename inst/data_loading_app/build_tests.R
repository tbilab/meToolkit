library(shinytest)

# Create test recording for main app.
app_dir <- 'inst/data_loading_app/'
recordTest(app_dir)

# This test just loads the app and snapshots
testApp(app_dir, testnames = 'basic_no_preloaded')

# This test loads the app and inputs all the needed csvs and lets the app
# proceed to the main screen
testApp(app_dir, testnames = 'load_all_data')

