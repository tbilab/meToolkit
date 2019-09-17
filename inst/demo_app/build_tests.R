# Setup shinytest library
# devtools::install_github('rstudio/shinytest')
# shinytest::installDependencies()
library(shinytest)

# Create test recording for main app.
recordTest('inst/demo_app/')

