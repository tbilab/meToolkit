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

  app_ui <- shiny::htmlTemplate(
    system.file("html_templates/empty_page.html", package = "meToolkit"),
    app_content = shiny::uiOutput("ui")
  )

 app_server <- function(input, output, session) {

   not_loaded_msg <- 'not loaded'
   # Main reactive that stores our data
   app_data <- reactiveVal()

   app_data(not_loaded_msg)

   have_no_data <- reactive({
     any(app_data() == not_loaded_msg)
   })

   shiny::observeEvent(have_no_data(),{

     if(have_no_data()) {
      data_loader_results <- shiny::callModule(
        meToolkit::data_loader,
        'data_loader',
        preloaded_path = preloaded_path
      )

      shiny::observeEvent(data_loader_results(), {
        # Fill in app data reactive with results from data loader.
        app_data(data_loader_results())
        # Reset data loader
        data_loader_results(NULL)
      })

     } else{
       print('Rendering main dashboard')
       # Show main app dashboard
       shiny::callModule(
         meToolkit::main_dashboard,
         'main_app',
         snp_name           = app_data()$snp_name,
         phewas_results     = app_data()$phewas_results,
         individual_data    = app_data()$individual_data,
         max_allowed_codes  = 45,
         show_back_button_messenger   = session$sendCustomMessage
       )
     }

   })

   # Watch back button for press
   shiny::observeEvent(input$back_button_clicked, {
     print('User clicked the back button')

     # Let app know data is loaded
     app_data(not_loaded_msg)
   })

   output$ui <- shiny::renderUI({
     # If we dont have any data, show loading screen, otherwise show the main dashboard
     if (have_no_data()) {
       meToolkit::data_loader_UI("data_loader", "Load Data for PheWAS-ME")
     } else{
       meToolkit::main_dashboard_UI("main_app")
     }
   })

 }

 if (auto_run) {
   shiny::shinyApp(app_ui, app_server)
 } else {
   return(list(ui = app_ui,
               server = app_server))
 }

}
