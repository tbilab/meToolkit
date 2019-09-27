# testing main app module in own shiny app.
library(shiny)
# library(meToolkit)
# Need to load fresh copy of package because shinytests runs in new thread.
# devtools::load_all('../')

data_loading_app <- run_me(
  preloaded_path = 'preloaded_data',
  auto_run = FALSE
)

shinyApp(data_loading_app$ui, data_loading_app$server)
