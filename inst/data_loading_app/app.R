# testing main app module in own shiny app.
library(shiny)
library(meToolkit)
library(readr)


ui <- htmlTemplate(
  system.file("html_templates/empty_page.html", package = "meToolkit"),
  app_content = uiOutput("ui")
)

server <- function(input, output, session) {

  # Shows preloaded data if provided a good path
  # loaded_data <- callModule(data_loader, 'data_loader', 'sample_data/')
  loaded_data <- callModule(data_loader, 'data_loader')

  output$ui <- renderUI({
    no_data <- is.null(loaded_data())
    if(no_data){
      data_loader_UI("data_loader", "Load Data for PheWAS-ME")
    }else{
      main_dashboard_UI("main_app")
    }
  })

  observeEvent(loaded_data(), {
    app_data <- loaded_data()

    callModule(
      main_dashboard, 'main_app',
      snp_name           = app_data$snp_name,
      phewas_results     = app_data$phewas_results,
      individual_data    = app_data$individual_data,
      max_allowed_codes  = 45
    )
  })
}


shinyApp(ui, server)
