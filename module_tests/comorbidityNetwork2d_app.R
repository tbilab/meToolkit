library(shiny)
library(shinydashboard)
library(meToolkit)
library(here)
library(tidyverse)

setup_data <- function(){
  # Load packaged fake phewas results dataframe with 1,578 phecodes
  data("fake_phewas_results")
  phewas_results <- fake_phewas_results %>%
    head() %>%
    mutate(code = meToolkit::normalizePhecode(code)) %>%
    meToolkit::buildColorPalette(category)

  # Some constants
  n_patients <- 2000
  snp_prev <- 0.15
  inverted_codes <- c()
  snp_filter <- FALSE

  individual_data <- phewas_results %>%
    meToolkit::simIndividualData(n_patients, snp_prev) %>% {
      right_join(
        .$phenotypes, .$snp_status,
        by = 'id'
      )
    } %>%
    rename(IID = id)


  network_data <- meToolkit::makeNetworkData(individual_data, phewas_results, inverted_codes)

  cases_with_edges <- network_data$edges %>%
    pull(source) %>%
    unique()

  # Make sure we're only drawing individuals with edges
  network_data$vertices <- network_data$vertices %>%
    filter((index %in% cases_with_edges) | (size == 0.3))

  network_data
}

ui <- shinyUI(
  tagList(
    h1('Network module test'),
    network2d_UI('networkPlot',  height = '500px')
  )
)

server <- function(input, output, session) {

  networkPlot <- callModule(
    network2d, 'networkPlot',
    reactive(setup_data()),
    snp_filter = reactive(FALSE),
    viz_type = 'free',
    update_freq = 15
  )

  observeEvent(networkPlot(),{
    print("we have a message from the network!")
    print(networkPlot())
  })
}

shinyApp(ui, server)


