# testing main app module in own shiny app.
library(meToolkit)
library(shiny)
library(shinydashboard)
library(shinydashboardPlus)
library(tidyverse)
library(magrittr)
library(here)
library(glue)

MAX_ALLOWED_CODES <- 45;

COLORS <- list(
  light_grey = "#f7f7f7",
  med_grey   = "#d9d9d9",
  dark_grey  = "#bdbdbd",
  light_red  = "#fcbba1",
  dark_red   = "#ef3b2c",
  light_blue = "#4292c6",
  green      = "#74c476"
)

NO_SNP_COLOR <- COLORS$dark_grey
ONE_SNP_COPY_COLOR <- COLORS$light_red
TWO_SNP_COPIES_COLOR <- COLORS$dark_red

individual_data <- read_rds('data/simulated_ind_data.rds')
results_data    <- read_rds('data/simulated_phewas_results.rds')
snp_name        <- 'rs13283456'


usage_instructions <- div(
  h2('How To Use'),
  h3("Manhattan Plot"),
  p("Use the Manhattan plot to select your codes of interest by dragging a box on main plot or searching/selecting with the table."),
  p("Once you have your desired codes selected press 'Update Network' button at top of pane to update the network data with individuals possessing the selected codes."),
  h3("Upset Plot"),
  p("The upset plot allows you to see basic statistics about comorbidity patterns in the selected subset of codes, such as number of patients with a pattern and the risk of that pattern occuring in individuals with at least one copy of the minor allele."),
  p("Clicking on a given pattern in the upset plot will highlight the patients with that pattern in the below network plot."),
  h3("Network Plot"),
  p("The network plot provides a direct look at the individual-level data. You can click on codes to select them for isolation or deletion from the current selection.")
)

ui <- htmlTemplate(
  "template.html",
  app_title = 'Multimorbidity Explorer',
  manhattan_plot = manhattan_plot_and_table_UI(
    'manhattan_plot',
    div_class = 'manhattan_plot'
  ),
  upset = upset_UI(
    'upsetPlot',
    div_class = 'upset_plot'
  ),
  network =  network_plot_UI('network_plot',
    height = '100%',
    div_class = 'network_plot',
    snp_colors = c(NO_SNP_COLOR, ONE_SNP_COPY_COLOR, TWO_SNP_COPIES_COLOR)
  ),
  info_panel = info_panel_UI('info_panel')
)


server <- function(input, output, session) {

  # Add colors to codes in results data.
  results_data <- buildColorPalette(results_data, category)

  #----------------------------------------------------------------
  # App state that can be modified by user.
  #   This explicitely defines what the user can interact with.
  #   Each snapshot of this state fully defines the current view of the app.
  #----------------------------------------------------------------
  state <- list(
    # Start with top 5 codes selected
    selected_codes = reactiveVal(results_data %>% arrange(p_val) %>% head(5) %>% pull(code)),
    # Start with all codes not inverted
    inverted_codes = reactiveVal(c()),
    # Start with all individuals regardless of snp status
    snp_filter = reactiveVal(FALSE),
    # Pattern to highlight in network plot,
    highlighted_pattern = reactiveVal(c())
  )

  #----------------------------------------------------------------
  # App values that change based upon the current state
  #----------------------------------------------------------------
  # Individual data subset by the currently viewed phecodes and if we've filtered the snp
  curr_ind_data <- reactive({

    keep_everyone <- !(state$snp_filter())
    # Filter the individual data to just MA carriers if needed, otw keep everyone

    individual_data %>%
      filter((snp > 0) | keep_everyone) %>%
      subsetToCodes(
        desired_codes = state$selected_codes(),
        codes_to_invert = state$inverted_codes()
      )
  })

  # Network representation of the current data for use in the network plot(s)
  curr_network_data <- reactive({
    makeNetworkData(
      data = curr_ind_data(),
      phecode_info = results_data,
      inverted_codes = state$inverted_codes(),
      no_copies = NO_SNP_COLOR,
      one_copy = ONE_SNP_COPY_COLOR,
      two_copies = TWO_SNP_COPIES_COLOR
    )
  })

  #----------------------------------------------------------------
  # Route all actions through a switch statement to modify the
  # app's values
  #----------------------------------------------------------------
  # Reactive variable that stores the most recent interaction
  app_interaction <- reactiveVal()

  observeEvent(app_interaction(),{
    action_type <- app_interaction() %>% pluck('type')
    action_payload <- app_interaction() %>% pluck('payload')
    extract_codes <- . %>% unlist() %>% tail(-1)
    remove_codes <- function(codes, to_remove){
      codes[!(codes %in% to_remove)]
    }

    print(glue("Action of type {action_type} received"))

    action_type %>%
      switch(
        delete = {
          codes_to_delete <- action_payload %>% extract_codes()
          prev_selected_codes <- state$selected_codes()
          state$selected_codes(remove_codes(prev_selected_codes, codes_to_delete))

          print('deleting codes:')
          print(codes_to_delete)
        },
        selection = {
          print('selecting codes!')
          codes_to_select <- action_payload %>%
            extract_codes()

          num_requested_codes <- length(codes_to_select)

          # Check size of request.
          if(num_requested_codes < 2){
            session$sendCustomMessage(
              "load_popup",
              list(
                title = "Too few codes requested",
                text = "Try selecting at least two codes."
              )
            )
          } else if (num_requested_codes > MAX_ALLOWED_CODES) {
            session$sendCustomMessage(
              "load_popup",
              list(
                title = "Too many codes requested",
                text = glue("The maximum allowed is {MAX_ALLOWED_CODES} and {num_requested_codes} were selected. \n\n This is so your computer doesn't explode. Try a smaller selection. Sorry!")
              )
            )
          } else {
            state$selected_codes(codes_to_select)
          }
        },
        isolate = {
          print('isolating codes!')
          desired_codes <- extract_codes(action_payload)
          if(length(desired_codes) < 2){
            warnAboutSelection()
          } else {
            state$selected_codes(desired_codes)
          }
        },
        snp_filter_change = {
          print('filtering snp status')
          state$snp_filter(!state$snp_filter())
          print(glue('New snp filter status is {state$snp_filter()}'))
        },
        pattern_highlight = {
          print('Upset sent a pattern higlight request')
          print(extract_codes(action_payload))
          state$highlighted_pattern(extract_codes(action_payload))
        },
        stop("Unknown input")
      )
  })

  #----------------------------------------------------------------
  # Setup all the components of the app
  #----------------------------------------------------------------
  ## Network plot
  callModule(
    network_plot, 'network_plot',
    curr_network_data,
    state$highlighted_pattern,
    snp_filter = state$snp_filter,
    viz_type = 'free',
    update_freq = 25,
    action_object = app_interaction
  )

  ## Upset plot
  upset_plot <- callModule(
    upset, 'upsetPlot',
    curr_ind_data,
    select(individual_data, IID, snp),
    results_data = results_data,
    colors = COLORS,
    app_interaction
  )

  ## Manhattan plot
  manhattan_plot <- callModule(
    manhattan_plot_and_table, 'manhattan_plot',
    results_data = results_data,
    selected_codes = state$selected_codes,
    action_object = app_interaction,
    colors = COLORS
  )

  ## PheWAS table
  callModule(
    phewas_table, 'phewas_table',
    results_data = results_data,
    selected_codes = state$selected_codes,
    action_object = app_interaction
  )

  ## Multicode selecter input
  observeEvent(input$filter_to_desired, {
    codes_desired <- input$desired_codes
    action_object_message <-  list(
      type = 'selection',
      payload = codes_desired
    )

    app_interaction(action_object_message)
  })

  # SNP info panel
  callModule(
    info_panel, 'info_panel',
    snp_name = snp_name,
    all_individual_data = individual_data,
    instructions = usage_instructions,
    colors = COLORS,
    current_individual_data = curr_ind_data
  )

}

shinyApp(ui, server)
