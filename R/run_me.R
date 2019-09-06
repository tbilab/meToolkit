#' Run ME app locally
#' Function to spawn a shiny app instance for Multimorbidity Explorer app with data loading screen.
#' @return Shiny app process
#' @export
#'
#' @examples
#' meToolkit::run_me()
run_me <- function(){

  app_ui <- shiny::htmlTemplate(
    system.file("html_templates/empty_page.html", package = "meToolkit"),
    app_content = shiny::uiOutput("ui")
  )

 app_server <- function(input, output, session) {

    # Shows preloaded data if provided a good path
    # loaded_data <- callModule(data_loader, 'data_loader', 'sample_data/')
    loaded_data <- shiny::callModule(
      meToolkit::data_loader,
      'data_loader'
    )

    output$ui <- shiny::renderUI({
      no_data <- is.null(loaded_data())
      if(no_data){
        meToolkit::data_loader_UI("data_loader", "Load Data for PheWAS-ME")
      }else{
        meToolkit::main_dashboard_UI("main_app")
      }
    })

    shiny::observeEvent(loaded_data(), {
      app_data <- loaded_data()

      shiny::callModule(
        main_dashboard, 'main_app',
        snp_name           = app_data$snp_name,
        results_data       = app_data$phewas_data,
        individual_data    = app_data$individual_data,
        max_allowed_codes  = 45
      )
    })
  }

  shiny::shinyApp(app_ui, app_server)
}
