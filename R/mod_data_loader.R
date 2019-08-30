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
  app_data <- reactiveValues(
    phenome_raw = NULL,
    genome_raw = NULL,
    phewas_raw = NULL,
    data_loaded = FALSE,         # has the user uploaded all their data and the app processed it?
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
      output$preloaded_snps <- renderUI({
        shiny::tagList(
          selectInput(
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


  observeEvent(input$genome, {

    tryCatch({
      good_genome_file <- read_csv(input$genome$datapath) %>%
        checkGenomeFile()

      app_data$snp_name <- good_genome_file$snp_name
      app_data$genome_raw <- good_genome_file$data
    },
    error = function(message){
      print(message)
      pretty_popup(
        session,
        "There's something wrong with the format of your genome data",
        " Make sure the file has two columns. One with the title IID with unique id and one with the title of your snp containing copies of the minor allele."
      )
    })
  })

  observeEvent(input$phewas, {

    tryCatch({
      app_data$phewas_raw <- read_csv(input$phewas$datapath) %>% checkPhewasFile()
    },
    error = function(message){
      print(message)
      pretty_popup(
        session,
        "There's something wrong with the format of your results data.",
        "Make sure the file has the right columns as listed."
      )
    })
  })

  observeEvent(input$phenome, {
    tryCatch({
      app_data$phenome_raw <- read_csv(input$phenome$datapath) %>% checkPhenomeFile()
    },
    error = function(message){
      print(message)
      pretty_popup(
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
  observe({
    req(app_data$phewas_raw, app_data$genome_raw, app_data$phenome_raw)

    withProgress(message = 'Loading data', value = 0, {
      # read files into R's memory
      incProgress(1/3, detail = "Reading in uploaded files")

      phenome <- app_data$phenome_raw
      genome  <- app_data$genome_raw
      phewas  <- app_data$phewas_raw

      # first spread the phenome data to a wide format
      incProgress(2/3, detail = "Processing phenome data")
      individual_data <- mergePhenomeGenome(phenome, genome)

      # These are codes that are not shared between the phewas and phenome data. We will remove them
      # from either.
      phenome_cols <- colnames(individual_data)
      bad_codes <- setdiff(phenome_cols %>% head(-1) %>% tail(-1), unique(phewas$code))

      app_data$phewas_data <- phewas
      app_data$individual_data <- individual_data

      # remove bad codes from phewas and individual data if needed
      if(length(bad_codes) > 0){
        app_data$phewas_data <- filter(app_data$phewas_data, !(code %in% bad_codes))
        app_data$individual_data <- app_data$individual_data[,-app_data$individual_data(phenome_cols %in% bad_codes)]
      }

      # Sending to app
      incProgress(3/3, detail = "Sending to application!")

      app_data$data_loaded <- TRUE
    }) # end progress messages
  })


  observeEvent(input$preLoadedData,{
    base_dir <- glue('data/preloaded/{input$dataset_selection}')

    app_data$phewas_raw <- glue('{base_dir}/phewas_results.csv') %>% read_csv()
    app_data$phenome_raw <- read_csv('data/preloaded/id_to_code.csv')
    genome_file <- glue('{base_dir}/id_to_snp.csv') %>%
      read_csv() %>% {
        this <- .

        # Hacky fix for having id as both IID and grid in different datasets.
        if(colnames(this)[1] == 'grid'){
          colnames(this)[1] = 'IID'
        }

        this
      } %>%
      checkGenomeFile()
    app_data$snp_name <- genome_file$snp_name
    app_data$genome_raw <- genome_file$data
  })

  return(
    reactive({
      if(app_data$data_loaded){
        list(
          individual_data = app_data$individual_data,
          category_colors = app_data$category_colors,
          phewas_data = app_data$phewas_data,
          snp_name = app_data$snp_name
        )
      } else {
        NULL
      }
    })
  )
}
