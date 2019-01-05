library(shiny)
library(shinydashboard)
library(meToolkit)
library(here)


# testing main app module in own shiny app.
n_codes <- 9
n_cases <- 200

individual_data <- meToolkit::simIndividualData(n_codes = n_codes, n_cases = n_cases, prob_snp = 0.1)
phewas_results <- meToolkit::simPhewasResults(n_codes = n_codes, n_categories = 3) %>%
  meToolkit::buildColorPalette(category)
inverted_codes <- c()
snp_filter <- FALSE


network_data <- meToolkit::makeNetworkData(individual_data,phewas_results, inverted_codes)


ui <- shinyUI(
  dashboardPage(
    dashboardHeader(
      title = "Multimorbidity Explorer",
      titleWidth = 300
    ),
    dashboardSidebar(
      h2('Settings'),
      sliderInput("setSize", "Min Size of Set:",
                  min = 0, max = 250,
                  value = 20),
      collapsed = TRUE
    ),
    dashboardBody(
      h2("My Network"),
      # network_plots_UI('network_plots', I),
      div(class = 'networkPlot', style = 'height: calc(80vh - 40px) !important;',
          r2d3::d3Output("networkPlot2d", height = '100%')
      )
    ),
    skin = 'black'
  )
)

server <- function(input, output, session) {
  # networks <- callModule(
  #   network_plots, 'network_plots',
  #   subset_data = subset_data,
  #   results_data = results_data,
  #   inverted_codes = inverted_codes,
  #   parent_ns = session$ns,
  #   snp_filter = TRUE # THIS NEEDS TO BE WIRED UP PROPERLY
  # )

  # send data and options to the 2d plot
  output$networkPlot2d <- r2d3::renderD3({
    network_data %>%
      jsonlite::toJSON() %>%
      r2d3::r2d3(
        script = here('inst/d3/comorbidityNetwork2d/index.js'),
        container = 'div',
        dependencies = "d3-jetpack",
        options = list(
          just_snp = snp_filter,
          msg_loc ='message'
        )
      )
  })

  #
  # observeEvent(input$message, {
  #   print('message from network')
  #   print(input$message)
  # })
}

shinyApp(ui, server)
