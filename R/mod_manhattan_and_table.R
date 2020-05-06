#' Interactive manhattan plot and table: UI
#'
#' For selecting codes for further visualization in app.
#'
#'
#' @seealso \code{\link{manhattan_plot_and_table}}
#' @param id String with unique id of module in app
#' @return UI component of interactive manhattan plot
#' @export
#'
#' @examples
#' manhattan_plot_and_table_UI('my_mod')
manhattan_plot_and_table_UI <- function(id) {
  ns <- NS(id)

  module_css <- "
    #phewas_panel select {
      width: 60px;
    }

    #phewas_panel .form-group{
      width: auto;
      display: flex;
      align-items: center;
      height: 100%;
      font-size: 0.8rem;
    }

    #phewas_panel label {
      padding-right: 4px;
    }
  "

  tagList(
    shiny::tags$style(module_css),
    shiny::div(
      id = "phewas_panel",
      class = "title-bar",
      shiny::h3("Interactive Phewas Manhattan Plot", class = "template-section-title"),
      shiny::selectInput(
        ns("significance_threshold"),
        label = "Signficance Threshold",
        choices = list("None", "0.05", "0.01"),
        selected = "None",
        selectize = FALSE
      ),
      help_modal_UI(
        id = ns("phewas"),
        title = "Help for ineractive phewas manhattan plot",
        help_img_url = "https://github.com/tbilab/meToolkit/raw/help_modals/inst/figures/phewas_help_page.png",
        more_link = "https://prod.tbilab.org/phewas_me_manual/articles/meToolkit.html#interactive-phewas-manhattan-plot"
      ),
    ),
    r2d3::d3Output(ns('manhattan_plot_and_table'), height = '100%')
  )
}

#' Interactive manhattan plot and table: Server
#'
#' Draw an interactive manhattan plot and table that can be used to send
#' selections for codes to the rest of the app.
#'
#'
#' @seealso \code{\link{manhattan_plot_and_table}}
#' @param input,output,session Auto-filled by callModule | ignore
#' @param results_data Dataframe containing the results of the phewas study.
#'   Needs columns \code{p_val}, \code{id}, \code{category}(along with
#'   accompanying \code{color}), \code{tooltip}.
#' @param selected_codes A reactive variable containing array of code \code{id}s
#'   that are currently selected in the app.
#' @param colors A list of CSS-valid colors to paint interface in. Needs
#'   \code{light_grey, med_grey, dark_grey, light_blue}.
#' @param action_object A \code{reactiveVal} that will be updated by the module
#'   upon selection
#' @return Server component of interactive manhattan plot. Returns type-payload
#'   list with the type \code{"selection"} to the passed \code{action_object}
#'   for updating app state.
#' @export
#'
#' @examples
#' callModule(manhattan_plot_and_table,  'my_mod', selected_codes, app_state$currently_selected)
manhattan_plot_and_table <- function(input,
                                     output,
                                     session,
                                     results_data,
                                     selected_codes,
                                     colors,
                                     action_object) {
  message_path <- 'message_manhattan_plot_and_table'

  timestamp <- Sys.time()

  # send data and options to the 2d plot
  output$manhattan_plot_and_table <- r2d3::renderD3({
    r2d3::r2d3(
      data = results_data,
      script = system.file("d3/manhattan_plot/manhattan_plot.js", package = "meToolkit"),
      container = 'div',
      dependencies = c(
        "d3-jetpack",
        system.file("d3/helpers.js", package = "meToolkit"),
        system.file("d3/manhattan_plot/phewas_table.js", package = "meToolkit"),
        system.file("d3/manhattan_plot/clusterize.js", package = "meToolkit")
      ),
      css = c(
        system.file("d3/helpers.css", package = "meToolkit"),
        system.file("d3/manhattan_plot/manhattan_plot.css", package = "meToolkit"),
        system.file("css/common.css", package = "meToolkit")
      ),
      options = list(
        msg_loc = session$ns(message_path),
        selected = selected_codes(),
        sig_bar_locs = input$significance_threshold,
        colors = colors,
        timestamp = timestamp
      )
    )
  })

  # Enable opening and closing of modal
  shiny::callModule(help_modal, "phewas")

  # If we've received a message, package it into the returned reactive value
  observeEvent(input[[message_path]], {
    validate(need(input[[message_path]], message = FALSE))
    action_object(input[[message_path]])
  })
}
