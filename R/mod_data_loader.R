#' UI function of upset module
#'
#' @param id String with unique id of module in app
#' @param app_title Name of your app. Defaults to "Multimorbidity Explorer"
#' @return HTML component of shiny module
#' @export
#'
#' @examples
#' data_loader_UI('my_app')
data_loader_UI <- function(id, app_title = "Multimorbidity Explorer") {
  ns <- NS(id)

  ACCEPTED_FORMATS <- c(
    "text/csv",
    "text/comma-separated-values,text/plain",
    ".csv")

  input_panel <- shiny::div(
    shiny::uiOutput(ns('preloaded_snps')),
    shiny::h3('Load your data'),
    shiny::fileInput(ns("phewas"), "Phewas results file", accept = ACCEPTED_FORMATS ),
    shiny::fileInput(ns("genome"), "ID to SNP file", accept = ACCEPTED_FORMATS ),
    shiny::fileInput(ns("phenome"), "ID to phenome file", accept = ACCEPTED_FORMATS )
  )

  shiny::tagList(
    use_reveal_element(),
    use_pretty_popup(),
    shiny::includeCSS(system.file("css/common.css", package = "meToolkit")),
    shiny::htmlTemplate(
      system.file("html_templates/data_loading_template.html", package = "meToolkit"),
      app_title = app_title,
      input_panel = input_panel,
      instruction_panel = shiny::includeMarkdown(system.file("data_instructions.md", package = "meToolkit"))
    )
  )
}
#' Server function of upset module
#'
#' @param input,output,session Auto-filled by callModule | ignore
#' @param preloaded_path File path relative to app that preloaded data is stored. Defaults to \code{NULL}.
#' @return Reactive object containing the data needed to run the main Multimorbidity Explorer dashboard.
#' @export
#'
#' @examples
#' callModule(data_loader, 'data_loader', 'data/preloaded')
data_loader <- function(
  input, output, session,
  preloaded_path = NULL
) {

  #----------------------------------------------------------------
  # Reactive Values based upon user input
  #----------------------------------------------------------------
  print('running loading module!')
  app_data <- shiny::reactiveValues(
    phenome_raw = NULL,
    genome_raw = NULL,
    phewas_raw = NULL,
    data_loaded = FALSE,         # has the user uploaded all their data and the app processed it?
    reconciled_data = NULL,
    individual_data = NULL,      # holds big dataframe of individual level data
    phewas_data = NULL,          # dataframe of results of univariate statistical tests
    snp_name = NULL              # Name of the current snp being looked at.
  )


  # Check if the user has given us a path to find preloaded data
  if(!is.null(preloaded_path)){
    # If they have, find all the snps they have preloaded
    preloaded_snps <- list.files(preloaded_path, pattern = 'rs')
    if(length(preloaded_snps) > 0){
      # Only show selector if there actually is data
      output$preloaded_snps <- shiny::renderUI({
        shiny::tagList(
          shiny::selectInput(
            session$ns("dataset_selection"),
            "Select a pre-loaded dataset:",
            preloaded_snps
          ),
          shiny::actionButton(session$ns('preLoadedData'), 'Use preloaded data'),
          shiny::hr()
        )
      })
    }
  }


  shiny::observeEvent(input$genome, {

    tryCatch({
      app_data$genome_raw <- readr::read_csv(input$genome$datapath) %>%
        meToolkit::checkGenomeFile(separate = FALSE)
    },
    error = function(message){
      print(message)
      meToolkit::pretty_popup(
        session,
        "There's something wrong with the format of your genome data",
        "Make sure the file has two columns. One with the title IID with unique id and one with the title of your snp containing copies of the minor allele."
      )
    })
  })

  shiny::observeEvent(input$phewas, {

    tryCatch({
      app_data$phewas_raw <- meToolkit::checkPhewasFile(readr::read_csv(input$phewas$datapath))
    },
    error = function(message){
      print(message)
      meToolkit::pretty_popup(
        session,
        "There's something wrong with the format of your results data.",
        "Make sure the file has the right columns as listed."
      )
    })
  })

  shiny::observeEvent(input$phenome, {
    tryCatch({
      app_data$phenome_raw <- meToolkit::checkPhenomeFile(readr::read_csv(input$phenome$datapath))
    },
    error = function(message){
      print(message)
      meToolkit::pretty_popup(
        session,
        "There's something wrong with the format of your phenome data.",
        "Make sure the file has the right columns as listed."
      )
    })
  })

  #----------------------------------------------------------------
  # Data Loading Logic
  #----------------------------------------------------------------
  # Watches for all files to be loaded and then triggers.
  shiny::observe({
    shiny::req(app_data$phewas_raw, app_data$genome_raw, app_data$phenome_raw)

    shiny::withProgress(message = 'Loading data', value = 0, {
      # read files into R's memory
      shiny::incProgress(1/3, detail = "Reading in uploaded files")

      app_data$reconciled_data <- meToolkit::reconcile_data(
        app_data$phewas_raw,
        app_data$genome_raw,
        app_data$phenome_raw
      )

      # Sending to app
      shiny::incProgress(3/3, detail = "Sending to application!")

      app_data$data_loaded <- TRUE
    }) # end progress messages
  })


  shiny::observeEvent(input$preLoadedData,{
    base_dir <- glue::glue('{preloaded_path}/{input$dataset_selection}')

    phewas_results <- readr::read_csv(glue::glue('{base_dir}/phewas_results.csv'))
    phenome <- readr::read_csv(glue::glue('{preloaded_path}/id_to_code.csv'))
    genome <- readr::read_csv( glue::glue('{base_dir}/id_to_snp.csv') )

    app_data$reconciled_data <- meToolkit::reconcile_data(
      phewas_results,
      phenome,
      genome
    )

    app_data$data_loaded <- TRUE
  })

  return(
    shiny::reactive({
      if(app_data$data_loaded){
        shiny::isolate(app_data$reconciled_data)
      } else {
        NULL
      }
    })
  )
}
