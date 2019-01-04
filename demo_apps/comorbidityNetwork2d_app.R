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
      # includeCSS(here("www/test_app.css")),
      # network_plots_UI('network_plots', I),
      h1('Hi There')
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
  #
  # observeEvent(input$message, {
  #   print('message from network')
  #   print(input$message)
  # })
}

shinyApp(ui, server)
