#' Help Modal UI
#'
#' @param id Unique id of module
#' @param title Header text for help modal
#' @param help_img_url Location of the helper image for modal
#' @param more_link Link to further information about context
#'
#' @return NULL
#' @export
help_modal_UI <- function(id, title, help_img_url, more_link) {
  ns <- NS(id)

  modal_css <- "
    .help_page .content {
      width: 80%;
      max-width: 850px;
      position: fixed;
      z-index: 100;
      top: 0;
      left: 0;
      right: 0;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
      margin-top: 2.4rem;
      background: white;
      border-radius: 10px;
      padding: 10px;
      box-shadow: 0px 0px 200px black;
    }

    .help_page::before {
      content: \"\";
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99;
      background: #0000007d;
      backdrop-filter: blur(4px);
    }

    .help_page.hidden {
      display: none;
    }

    .help_page.hidden::before {
      content: none;
    }

    .help_page img {
      max-width: 100%;
    }

    .title-bar-help-btn {
      border-radius: 50%;
      width: 2rem;
      height: 2rem;
      text-align: center;
      padding: 0;
    }

    .help_bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  "
  # Javascript code that opens and closes this particular modal
  modal_toggle_js <- glue::glue("
    Shiny.addCustomMessageHandler('{ns('show_modal')}', function(msg) {{
      $('#{ns('modal')}').removeClass('hidden');
    }});

    Shiny.addCustomMessageHandler('{ns('hide_modal')}', function(msg) {{
      $('#{ns('modal')}').addClass('hidden');
    }});
  ")

  shiny::tagList(
    shiny::tags$head(shiny::tags$script(modal_toggle_js)),
    shiny::tags$style(modal_css),
    shiny::actionButton(ns('open_help'), class = "title-bar-help-btn", label = "?"),
    shiny::div(
      id = ns('modal'),
      class = "help_page hidden",
      shiny::div(
        class = "content",
        shiny::h1(title),
        shiny::div(shiny::img(src = help_img_url)),
        shiny::div(
          class = "help_bottom",
          shiny::actionButton(ns("close_help"), label = "Close"),
          shiny::a(
            "🔎More information",
            href = more_link,
            style = "padding-left: 2rem;",
            target = "_blank"
          )
        )
      )
    )
  )
}

#' Help Modal Server
#'
#' @param input,output,session Auto-filled by `callModule` | ignore
#'
#' @return NULL
#' @export
help_modal <- function(input,
                       output,
                       session) {
  observeEvent(input$open_help, {
    session$sendCustomMessage(session$ns("show_modal"), "")
  })

  observeEvent(input$close_help, {
    session$sendCustomMessage(session$ns("hide_modal"), "")
  })
}
