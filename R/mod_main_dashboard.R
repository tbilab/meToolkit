#' Main Multimorbidity Explorer Dashboard: UI function
#'
#'
#' @seealso \code{\link{main_dashboard}}
#' @param id String with unique id of module in app
#' @param snp_colors Array of css color codes for 0, 1, and 2 copies of the
#'   minor allele in network plot.
#' @return HTML component of shiny module
#' @export
#'
#' @examples
#' main_dashboard_UI('my_app')
main_dashboard_UI <- function(id, snp_colors = c("#bdbdbd", "#fcbba1", "#ef3b2c")) {
  ns <- NS(id)
  shiny::tagList(
    use_pretty_popup(),
    shiny::includeCSS(system.file("css/common.css", package = "meToolkit")),
    shiny::htmlTemplate(
      system.file("html_templates/main_dashboard.html", package = "meToolkit"),
      app_title = 'Multimorbidity Explorer',
      manhattan_plot_title = 'Interactive Phewas Manhattan Plot',
      manhattan_plot = meToolkit::manhattan_plot_and_table_UI(ns('manhattan_plot')),
      upset_title = 'Comorbidity Upset Plot',
      upset = meToolkit::upset_UI(ns('upsetPlot')),
      network_title = 'Subject-Phecode Bipartite Network',
      network = meToolkit::network_plot_UI(ns('network_plot'),
                                 snp_colors = snp_colors
      ),
      info_panel = meToolkit::info_panel_UI(ns('info_panel'))
    )
  )
}

#' Main Multimorbidity Explorer Dashboard: Server function
#'
#' Generates a full dashboard page containing various visualizations for
#' investigating comobidity patterns in individual level data and how they
#' relate to the results of a phewas analysis.
#'
#'
#' @seealso \code{\link{main_dashboard_UI}}
#' @param input,output,session Auto-filled by callModule | ignore
#' @param snp_name Character string containing the RSID of the snp you're
#'   viewing. Used to find annotation information.
#' @param phewas_results Dataframe containing the results of the phewas study.
#'   Needs columns \code{p_val}, \code{id}, \code{category}(along with
#'   accompanying \code{color}), \code{tooltip}.
#' @param individual_data Dataframe containing columns on \code{IID},
#'   \code{snp}(# copies of allele), and columns for each code included.
#' @param max_allowed_codes How many codes can the app show at any given time.
#'   Defaults to 40. (Too many and app may get slow.)
#' @param usage_instructions HTML tags corresponding to static content to be
#'   displayed in bottom half of info panel. Any html content works. Defaults to
#'   light description.
#' @param colors A list of CSS-valid colors to paint interface in if custom
#'   colors desired. Needs \code{light_grey, med_grey, dark_grey, light_blue,
#'   light_red, dark_red, light_blue, green}.
#' @return Shiny module of main Multimorbidity Explorer dashboard
#' @export
#'
#' @examples
#' callModule(
#'   main_dashboard, 'main_dashboard',
#'   my_phewas_results,
#'   my_individual_data,
#'   usage_instructions = 'This app is complicated!'
#' )
main_dashboard <- function(
  input, output, session,
  snp_name,
  phewas_results,
  individual_data,
  max_allowed_codes = 40,
  usage_instructions = 'default',
  colors = list(
    light_grey = "#f7f7f7",
    med_grey   = "#d9d9d9",
    dark_grey  = "#bdbdbd",
    light_red  = "#fcbba1",
    dark_red   = "#ef3b2c",
    light_blue = "#4292c6",
    green      = "#74c476"
  )
 ) {

  if(usage_instructions == 'default'){
    app_instructions <- div(
      h2('How To Use'),
      h3('Interactive Phewas Manhattan Plot'),
      p("Use the Manhattan plot to select your codes of interest by dragging a box on main plot or searching/selecting with the table."),
      p("Once you have your desired codes selected press 'Update Network' button at top of pane to update the network data with individuals possessing the selected codes."),
      h3('Comorbidity Upset Plot'),
      p("The upset plot allows you to see basic statistics about comorbidity patterns in the selected subset of codes, such as number of patients with a pattern and the risk of that pattern occuring in individuals with at least one copy of the minor allele."),
      p("Clicking on a given pattern in the upset plot will highlight the patients with that pattern in the below network plot."),
      h3('Subject-Phecode Bipartite Network'),
      p("The network plot provides a direct look at the individual-level data. You can click on codes to select them for isolation or deletion from the current selection.")
    )
  } else {
    app_instructions <- usage_instructions
  }

  # Add colors to codes in results data.
  phewas_results <- meToolkit::buildColorPalette(phewas_results, category)

  # Get available codes sorted by p-value
  available_codes <- phewas_results %>%
    dplyr::arrange(p_val) %>%
    dplyr::pull(code)

  # Look to see if the URL used had desired codes in it.
  url_message <- isolate(session$clientData$url_search)

  starting_codes <- c()
  if(url_message != ""){
    requested_codes <- url_message %>%
      stringr::str_remove('\\?') %>%
      stringr::str_split('_') %>%
      purrr::pluck(1) %>%
      stringr::str_replace("(.{3})(.*)", "\\1.\\2")

    # Make sure that we actually have these codes...
    starting_codes <- intersect(requested_codes, available_codes)
  }

  # Fall back to using the five most significant codes if nothing was suggested
  # or no codes of the suggested could be found
  if(length(starting_codes) == 0){
      starting_codes <- head(available_codes, 5)
  }

  #----------------------------------------------------------------
  # App state that can be modified by user.
  #   This explicitely defines what the user can interact with.
  #   Each snapshot of this state fully defines the current view of the app.
  #----------------------------------------------------------------
  state <- list(
    # Start with top 5 codes selected
    selected_codes = shiny::reactiveVal(starting_codes),
    # Start with all codes not inverted
    inverted_codes = shiny::reactiveVal(c()),
    # Start with all individuals regardless of snp status
    snp_filter = shiny::reactiveVal(FALSE),
    # Pattern to highlight in network plot,
    highlighted_pattern = shiny::reactiveVal(list(type = 'pattern', codes = c()))
  )

  #----------------------------------------------------------------
  # App values that change based upon the current state
  #----------------------------------------------------------------
  # Individual data subset by the currently viewed phecodes and if we've filtered the snp
  curr_ind_data <- shiny::reactive({

    keep_everyone <- !state$snp_filter()
    # Filter the individual data to just MA carriers if needed, otw keep everyone

    individual_data %>%
      dplyr::filter((snp > 0) | keep_everyone) %>%
      meToolkit::subsetToCodes(
        desired_codes = state$selected_codes(),
        codes_to_invert = state$inverted_codes()
      )
  })

  # Network representation of the current data for use in the network plot(s)
  curr_network_data <- shiny::reactive({
    meToolkit::makeNetworkData(
      data = curr_ind_data(),
      phecode_info = phewas_results,
      inverted_codes = state$inverted_codes(),
      no_copies = colors$dark_grey,
      one_copy = colors$light_red,
      two_copies = colors$dark_red
    )
  })

  #----------------------------------------------------------------
  # Route all actions through a switch statement to modify the
  # app's values
  #----------------------------------------------------------------
  # Reactive variable that stores the most recent interaction
  app_interaction <- shiny::reactiveVal()

  # Function to retreive codes from an action payload
  extract_codes <- function(payload){
    tail(unlist(payload), -1)
  }

  shiny::observeEvent(app_interaction(),{
    action_type <- app_interaction()[['type']]
    action_payload <- app_interaction()[['payload']]

    bad_request_msg <- function(num_requested = 1){
      if(num_requested < 2){
        meToolkit::pretty_popup(
          session,
          "Too few codes requested",
          "Try selecting at least two codes."
        )
      } else {
        meToolkit::pretty_popup(
          session,
          "Too many codes requested",
          glue::glue("The maximum allowed is {max_allowed_codes} and {num_requested} were selected. \n\n This is so your computer doesn't explode. Try a smaller selection. Sorry!")
        )
      }
    }

    action_type %>%
      switch(
        delete = {
          codes_to_delete <- extract_codes(action_payload)
          prev_selected_codes <- state$selected_codes()
          state$selected_codes(
            prev_selected_codes[!(prev_selected_codes %in% codes_to_delete)]
          )
        },
        selection = {
          codes_to_select <- extract_codes(action_payload)
          num_requested_codes <- length(codes_to_select)

          # Check size of request.
          if((num_requested_codes < 2 )| (num_requested_codes > max_allowed_codes)){
            bad_request_msg(num_requested_codes)
          } else {
            state$selected_codes(codes_to_select)
          }
        },
        isolate = {
          desired_codes <- extract_codes(action_payload)
          if(length(desired_codes) < 2){
            bad_request_msg(length(desired_codes))
          } else {
            state$selected_codes(desired_codes)
          }
        },
        snp_filter_change = {
          state$snp_filter(!state$snp_filter())
        },
        pattern_highlight = {
          # Highlight all nodes with specific pattern
          state$highlighted_pattern(
            list(type = 'pattern', codes = extract_codes(action_payload))
          )
        },
        code_highlight = {
          # Highlight all nodes who have a connection to a given code.
          state$highlighted_pattern(
            list(type = 'code', codes = extract_codes(action_payload)[1])
          )
        },
        invert = {
          currently_inverted <- state$inverted_codes()
          requested_inversion <- extract_codes(action_payload)
          new_inverted_list <- meToolkit::invertCodes(requested_inversion, currently_inverted)
          state$inverted_codes(new_inverted_list)
        },
        stop("Unknown input")
      )

     # Update the URL of the app so user's can return to point easily
    saved_codes <- state$selected_codes() %>%
      stringr::str_remove('\\.') %>%
      paste(collapse = '_')

    shiny::updateQueryString(glue::glue("?{saved_codes}"))
  })

  #----------------------------------------------------------------
  # Setup all the components of the app
  #----------------------------------------------------------------
  ## Network plot
  shiny::callModule(
    meToolkit::network_plot, 'network_plot',
    network_data = curr_network_data,
    highlighted_codes = state$highlighted_pattern,
    snp_filter = state$snp_filter,
    viz_type = 'free',
    update_freq = 25,
    action_object = app_interaction
  )

  ## Upset plot
  shiny::callModule(
    meToolkit::upset, 'upsetPlot',
    individual_data = curr_ind_data,
    all_patient_snps = dplyr::select(individual_data, IID, snp),
    results_data = phewas_results,
    colors = colors,
    app_interaction
  )

  ## Manhattan plot
  shiny::callModule(
    meToolkit::manhattan_plot_and_table, 'manhattan_plot',
    results_data = phewas_results,
    selected_codes = state$selected_codes,
    action_object = app_interaction,
    colors = colors
  )

  # SNP info panel
  shiny::callModule(
    info_panel, 'info_panel',
    snp_name = snp_name,
    all_individual_data = individual_data,
    instructions = app_instructions,
    colors = colors,
    current_individual_data = curr_ind_data
  )

  # Multicode selecter input
  shiny::observeEvent(input$filter_to_desired, {
    codes_desired <- input$desired_codes
    action_object_message <-  list(
      type = 'selection',
      payload = codes_desired
    )
    app_interaction(action_object_message)
  })
}
