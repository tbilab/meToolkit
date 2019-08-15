library(shiny)
library(shinydashboard)
library(magrittr)
library(tidyverse)
library(meToolkit)
library(glue)

# library(crosstalk)

data("fake_phewas_results")

phewas_results <- fake_phewas_results %>%
  mutate(
    code = meToolkit::normalizePhecode(code),
    tooltip = paste(
      "</br><i>Code</i>", code,
      "</br><i>Description</i>", description,
      "</br><i>Category</i>", category,
      "</br><i>OR</i>", OR,
      "</br><i>P-Value</i>", p_val
    )
  ) %>%
  select(-code_proportion) %>%
  meToolkit::buildColorPalette(category)

first_selected <- phewas_results %>%
  arrange(p_val) %>%
  head() %>%
  pull(code)

ui <- shinyUI(
  tagList(
    h1('Manhattan module test'),
    manhattan_plot_and_table_UI('manhattan_plot')
  )
)

server <- function(input, output, session) {

  selected_codes <- reactiveVal(first_selected)

  action_object <- reactiveVal()

  callModule(
    manhattan_plot_and_table, 'manhattan_plot',
    phewas_results,
    selected_codes,
    action_object
  )

  # observeEvent(action_object(),{
  #   print("we have received a message from within the plot!")
  #   print(action_object())
  #   # Update codes
  #   selected_codes(action_object()$payload)
  # })

}

shinyApp(ui, server)
