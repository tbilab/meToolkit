library(shiny)
library(shinydashboard)
library(meToolkit)
library(here)
library(tidyverse)


# Load packaged fake phewas results dataframe with 1,578 phecodes
data("fake_phewas_results")
phewas_results <- fake_phewas_results %>%
  head() %>%
  mutate(code = meToolkit::normalize_phecodes(code)) %>%
  meToolkit::build_color_palette(category)

# Some constants
snp_prev <- 0.15
inverted_codes <- c()
snp_filter <- FALSE


generate_random_data <- function(n_patients = 1000){
  individual_data <- phewas_results %>%
    meToolkit::sim_individual_data(n_patients, snp_prev) %>% {
      right_join(
        .$phenotypes, .$snp_status,
        by = 'id'
      )
    } %>%
    rename(IID = id)

  patient_w_pattern <- individual_data %>%
    gather(code, value, -IID, -snp) %>%
    filter(value != 0) %>%
    count(IID) %>%
    arrange(-n) %>%
    head(1) %>%
    pull(IID)

  pattern_to_highlight <- individual_data %>%
    filter(IID == patient_w_pattern) %>%
    gather(code, value, -IID, -snp) %>%
    filter(value != 0) %>%
    pull(code)

  network_data <- meToolkit::setup_network_data(individual_data, phewas_results, inverted_codes)

  cases_with_edges <- network_data$edges %>%
    pull(source) %>%
    unique()

  # Make sure we're only drawing individuals with edges
  network_data$vertices <- network_data$vertices %>%
    filter((index %in% cases_with_edges) | (size == 0.3))

  list(network_data = network_data, pattern = pattern_to_highlight)
}

ui <- shinyUI(
  tagList(
    h1('Network module test'),
    actionButton('update_w_pattern', 'highlight a pattern'),
    network_plot_UI('network_plot',  height = '500px')
  )
)

server <- function(input, output, session) {
  random_data <- generate_random_data(1000)

  app_network_data <- reactiveVal(random_data$network_data)
  app_network_pattern <- reactiveVal(c())
  app_snp_filter <- reactiveVal(FALSE)

  action_object <- reactiveVal()

  callModule(
    network_plot, 'network_plot',
    app_network_data,
    app_network_pattern,
    snp_filter = app_snp_filter,
    viz_type = 'free',
    update_freq = 15,
    action_object = action_object
  )

  observeEvent(input$update_w_pattern, {
    print('highlighting a pattern')

    random_code <- (app_network_data()$vertices) %>%
      filter(selectable) %>%
      sample_n(1) %>%
      pull(name)

    print(random_code)
    app_network_pattern(c(random_code))
  })

  observeEvent(action_object(),{
    print("we have a message from the network!")
    random_data <- generate_random_data(rpois(1, 1000))

    app_network_data(random_data$network_data)
    app_network_pattern(c())

    app_snp_filter(!app_snp_filter())
    print(action_object())
  })
}

shinyApp(ui, server)


