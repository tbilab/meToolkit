#' Run ME app locally
#'
#' Function to spawn a shiny app instance for Multimorbidity Explorer app with
#' data loading screen.
#'
#' @inheritParams data_loader
#' @inheritParams build_me_app
#'
#' @return Shiny app process
#' @export
#'
#' @examples
#' \dontrun{
#' meToolkit::run_me()
#' }
run_me <- function(preloaded_path = NULL, auto_run = FALSE){

  path_for_preloaded <-
  app_ui <- shiny::htmlTemplate(
    system.file("html_templates/empty_page.html", package = "meToolkit"),
    app_content = shiny::uiOutput("ui")
  )

 app_server <- function(input, output, session) {

    # Shows preloaded data if provided a good path
    # loaded_data <- callModule(data_loader, 'data_loader', 'sample_data/')
   if(is.null(preloaded_path) ){
     loaded_data <- shiny::callModule(
       meToolkit::data_loader,
       'data_loader',
     )
   } else {
    loaded_data <- shiny::callModule(
      meToolkit::data_loader,
      'data_loader',
      preloaded_path = preloaded_path
    )
   }

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
        meToolkit::main_dashboard, 'main_app',
        snp_name           = app_data$snp_name,
        phewas_results     = app_data$phewas_results,
        individual_data    = app_data$individual_data,
        max_allowed_codes  = 45
      )
    })
 }

 if(auto_run){
    shiny::shinyApp(app_ui, app_server)
 } else {
   return(list(
     ui = app_ui,
     server = app_server
   ))
 }

}
