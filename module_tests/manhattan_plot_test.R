library(shiny)
library(shinydashboard)
library(magrittr)
library(tidyverse)
library(meToolkit)
library(glue)

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
    manhattan_plot_UI('manhattan_plot')
  )
)

server <- function(input, output, session) {

  selected_codes <- reactiveVal(first_selected)

  manhattan_plot <- callModule(
    manhattan_plot, 'manhattan_plot',
    phewas_results,
    selected_codes
  )

  observeEvent(manhattan_plot(),{
    print("we have a message from the plot!")
    selected_codes(manhattan_plot()$payload)
    print(manhattan_plot())
  })

}

shinyApp(ui, server)
