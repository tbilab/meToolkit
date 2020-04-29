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
run_me <-
  function(preloaded_path = NULL,
           auto_run = FALSE,
           snp_colors = c('#bdbdbd', '#fecc5c', '#a50f15')) {
    app_ui <- shiny::htmlTemplate(
      system.file("html_templates/empty_page.html", package = "meToolkit"),
      app_content = shiny::uiOutput("ui")
    )

    app_server <- function(input, output, session) {
      current_view <- reactiveVal("loader")

      output$ui <- shiny::renderUI({
        if (current_view() == "loader") {
          meToolkit::data_loader_UI("data_loader", "Load Data for PheWAS-ME")
        } else{
          meToolkit::main_dashboard_UI("main_app", snp_colors = snp_colors)
        }
      })

      # Render the main dashboard if we have data to do so
      shiny::observe({
        shiny::req(data_loader_results())

        # Change view to dashboard
        current_view("dashboard")

        app_data <- data_loader_results()
        shiny::callModule(
          meToolkit::main_dashboard,
          "main_app",
          snp_name           = app_data$snp_name,
          phewas_results     = app_data$phewas_results,
          individual_data    = app_data$individual_data,
          max_allowed_codes  = 45,
          show_back_button_messenger = session$sendCustomMessage,
          snp_colors         = snp_colors
        )
      })

      # Render the data loading module
      data_loader_results <-
        shiny::callModule(meToolkit::data_loader,
                          "data_loader",
                          preloaded_path = preloaded_path)

      # Watch back button for press
      shiny::observeEvent(input$back_button_clicked, {
        # Clear the bookmarked state in URL
        shiny::updateQueryString("?")

        # Let app know data is loaded
        current_view("loader")
      })

    } # End app_server()

    if (auto_run) {
      shiny::shinyApp(app_ui, app_server)
    } else {
      return(list(ui = app_ui,
                  server = app_server))
    }

  }
