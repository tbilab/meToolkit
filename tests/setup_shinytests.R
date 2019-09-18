# Build and run shinytests on the main apps.
# This is used to setup the automated testhat tests but also
# for manual running of tests.

# Setup shinytest library
# devtools::install_github('rstudio/shinytest')
# shinytest::installDependencies()
library(shinytest)
devtools::load_all(".")


# ======================================================================
# Main Dashboard
# ======================================================================
dashboard_demo <- system.file(package = "meToolkit", "demo_app")

# Create test recording for main app.
# recordTest(dashboard_demo)

# Run test
testApp(dashboard_demo)



# ======================================================================
# Data loading screen
# ======================================================================
dataloading_demo <- system.file(package = "meToolkit", "data_loading_app")

recordTest(dataloading_demo)

# This test just loads the app and snapshots
# testApp(dataloading_demo, testnames = 'basic_no_preloaded')

# This test loads the app and inputs all the needed csvs and lets the app
# proceed to the main screen
testApp(dataloading_demo, testnames = 'load_all_data')

