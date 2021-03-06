#' Run a ME app with data loading screen
#'
#' Function to spawn a shiny app instance for Multimorbidity Explorer app with
#' data loading screen. Optionally data can be preloaded.
#'
#'
#'
#' @section Preloading data: If a set of results are going to be repeatedly
#'   visited in the app, the data for the results can be preloaded to save time.
#'   Once data is preloaded it populates a dropdown menu on the data-loading
#'   screen that can be used to select the desired dataset. To do this, the data
#'   must be loaded into a path (relative to the main app working directory)
#'   provided to `run_data_loader()` in the `preloaded_data_path` argument.
#'   The neccesary files, relative to `preloaded_data_loc/` are:
#'   \itemize{
#'     \item `<SNP_ID>/id_to_code.csv` or `id_to_code.csv`:  Subject-level phenome file (if left in main preloaded directory is used as common phenome)
#'     \item `<SNP_ID>/id_to_snp.csv`: Subject-level genotype file
#'     \item `<SNP_ID>/phewas_results.csv`: PheWAS results
#'    }
#'   For further details on the format of these dataset see the [getting started article on package website.](https://prod.tbilab.org/phewas_me_manual/articles/meToolkit.html)
#' @inheritParams data_loader
#' @inheritParams build_me_dashboard
#'
#' @return Shiny app process
#' @export
#'
#' @examples
#' \dontrun{
#' meToolkit::build_me_w_loader()
#' }
build_me_w_loader <-
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
