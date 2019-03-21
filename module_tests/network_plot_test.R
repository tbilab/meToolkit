library(shiny)
library(shinydashboard)
library(meToolkit)
library(here)
library(tidyverse)


# Load packaged fake phewas results dataframe with 1,578 phecodes
data("fake_phewas_results")
phewas_results <- fake_phewas_results %>%
  head() %>%
  mutate(code = meToolkit::normalizePhecode(code)) %>%
  meToolkit::buildColorPalette(category)

# Some constants
n_patients <- 1000
snp_prev <- 0.15
inverted_codes <- c()
snp_filter <- FALSE


generate_random_data <- function(){
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
    network_plot_UI('network_plot',  height = '500px')
  )
)

server <- function(input, output, session) {
  app_network_data <- reactiveVal(generate_random_data())
  app_snp_filter <- reactiveVal(FALSE)

  action_object <- reactiveVal()

  callModule(
    network_plot, 'network_plot',
    app_network_data,
    snp_filter = app_snp_filter,
    viz_type = 'free',
    update_freq = 15,
    action_object = action_object
  )

  observeEvent(action_object(),{
    print("we have a message from the network!")
    app_network_data(generate_random_data())
    app_snp_filter(!app_snp_filter())
    print(action_object())
  })
}

shinyApp(ui, server)


