#' Data loading screen: UI
#'
#' @param id String with unique id of module in app
#' @param app_title Name of your app. Defaults to "Multimorbidity Explorer"
#' @return HTML component of shiny module
#' @export
#'
#' @examples
#' data_loader_UI('my_app')
data_loader_UI <-
  function(id, app_title = "Multimorbidity Explorer") {
    ns <- NS(id)

    accepter_formats <- c("text/csv",
                          "text/comma-separated-values,text/plain",
                          ".csv")

    input_panel <- shiny::div(
      shiny::uiOutput(ns("preloaded_snps")),
      shiny::h3("Load your data"),
      shiny::fileInput(ns("phewas"),
                       "Phewas results file",
                       accept = accepter_formats),
      shiny::fileInput(ns("genome"),
                       "ID to SNP file",
                       accept = accepter_formats),
      shiny::fileInput(ns("phenome"),
                       "ID to phenome file",
                       accept = accepter_formats),
      shiny::h3("P-Value adjustment"),
      shiny::p("Should multiple-comparisons adjustment be done on P-Values of phewas results file?"),
      shiny::radioButtons(ns("pval_correction"), label = h3("Correction type"),
                   choices = list("None" = "none", "Bonferroni" = "bonferroni", "Benjamini-Hochberg" = "BH"),
                   selected = "none")
    )

    shiny::tagList(
      shiny::includeCSS(system.file("css/common.css", package = "meToolkit")),
      shiny::htmlTemplate(
        system.file("html_templates/data_loading_template.html",
                    package = "meToolkit"),
        app_title = app_title,
        input_panel = input_panel,
        instruction_panel = shiny::includeMarkdown(system.file("data_instructions.md",
                                                               package = "meToolkit"))
      )
    )
  }

#' Data loading screen: Server
#'
#' @param input,output,session Auto-filled by callModule | ignore
#' @param preloaded_path File path relative to app that preloaded data is
#'   stored. Defaults to \code{NULL}.
#' @return Reactive object containing the data needed to run the main
#'   Multimorbidity Explorer dashboard.
#' @export
#'
#' @examples
#' callModule(data_loader, "data_loader", "data/preloaded")
data_loader <- function(input, output, session,
                        preloaded_path = NULL) {
  #----------------------------------------------------------------
  # Reactive Values based upon user input
  #----------------------------------------------------------------
  print("running loading module!")
  app_data <- shiny::reactiveValues(
    phenome_raw = NULL,
    genome_raw = NULL,
    phewas_raw = NULL,
    data_loaded = FALSE,
    # has the user uploaded all their data and the app processed it?
    reconciled_data = NULL,
    individual_data = NULL,
    # holds big dataframe of individual level data
    phewas_data = NULL,
    # dataframe of results of univariate statistical tests
    snp_name = NULL              # Name of the current snp being looked at.
  )

  pretty_popup <- function(title, msg){
    session$sendCustomMessage(
      "load_popup",
      list(title = title, text = msg)
    )
  }

  data_to_return <- reactiveVal()

  bookmarked_snp <- reactiveVal()

  # Look to see if the URL used had desired codes in it.
  url_state <- extract_snp_codes_from_url(session)

  have_requested_snp <- !is.null(url_state$snp)

  # Check if the user has given us a path to find preloaded data
  if (!is.null(preloaded_path)) {
    # If they have, find all the snps they have preloaded
    preloaded_snps <- list.files(preloaded_path, pattern = "rs")
    if (length(preloaded_snps) > 0) {
      # Only show selector if there actually is data
      output$preloaded_snps <- shiny::renderUI({
        shiny::tagList(
          shiny::selectInput(
            session$ns("dataset_selection"),
            "Select a pre-loaded dataset:",
            preloaded_snps
          ),
          shiny::actionButton(session$ns("preLoadedData"),
                              "Use preloaded data"),
          shiny::hr()
        )
      })

      # Check if the user has requested a snp that is in our preloaded snps list
      # if they have, auto-load that snp
      if (have_requested_snp) {
        if (url_state$snp %in% preloaded_snps) {
          bookmarked_snp(url_state$snp)
        } else {
          print(glue::glue("Requested SNP {url_state$snp} was not available"))
        }
      }
    }
  }


  shiny::observeEvent(input$genome, {
    tryCatch({
      app_data$genome_raw <- readr::read_csv(input$genome$datapath) %>%
        check_genome_file(separate = FALSE)
    },
    error = function(message) {
      print(message)
      pretty_popup(title = "There's something wrong with the format of your genome data",
                   msg = glue::glue(
                     "Make sure the file has two columns. One with the title",
                     "IID with unique id and one with the title of your snp ",
                     "containing copies of the minor allele."
                   ))
    })
  })

  shiny::observeEvent(input$phewas, {
    tryCatch({
      app_data$phewas_raw <- check_phewas_file(readr::read_csv(input$phewas$datapath))
    },
    error = function(message) {
      print(message)
      pretty_popup(
        "There's something wrong with the format of your results data.",
        "Make sure the file has the right columns as listed."
      )
    })
  })

  shiny::observeEvent(input$phenome, {
    tryCatch({
      app_data$phenome_raw <- check_phenome_file(readr::read_csv(input$phenome$datapath))
    },
    error = function(message) {
      print(message)
      pretty_popup(
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
    shiny::req(app_data$phewas_raw,
               app_data$genome_raw,
               app_data$phenome_raw)

    shiny::withProgress(message = "Loading data", value = 0, {
      # read files into R's memory
      shiny::incProgress(1 / 3, detail = "Reading in uploaded files")

      app_data$reconciled_data <- reconcile_data(
        phewas_results = app_data$phewas_raw,
        id_to_snp = app_data$genome_raw,
        id_to_code = app_data$phenome_raw,
        multiple_comparisons_adjustment = input$pval_correction
      )

      # Sending to app
      shiny::incProgress(3 / 3, detail = "Sending to application!")

      app_data$data_loaded <- TRUE
    }) # end progress messages
  })

  trigger_preload <- reactive({
    have_bookmarked_snp <- !is.null(bookmarked_snp())
    preload_button_pressed <- input$preLoadedData != 0
    req(have_bookmarked_snp | preload_button_pressed)
    list(input$preLoadedData, bookmarked_snp())
  })

  shiny::observeEvent(trigger_preload(), {

    base_dir <- fs::path(preloaded_path, input$dataset_selection)

    # Check if there is a phenome file available in the SNPs folder
    has_snp_specific_phenome <- fs::path(base_dir, "id_to_code.csv") %>% fs::file_exists()
    phenome_loc <- if(has_snp_specific_phenome) fs::path(base_dir, "id_to_code.csv") else fs::path(preloaded_path, "id_to_code.csv")
    genome_loc <- fs::path(base_dir, "id_to_snp.csv")
    phewas_loc <- fs::path(base_dir, "phewas_results.csv")

    phenome <- readr::read_csv(phenome_loc)
    phewas_results <- readr::read_csv(phewas_loc)
    genome <- readr::read_csv(genome_loc)

    app_data$reconciled_data <- reconcile_data(
      phewas_results =  phewas_results,
      id_to_snp = genome,
      id_to_code = phenome,
      multiple_comparisons_adjustment = input$pval_correction
    )

    app_data$data_loaded <- TRUE

    data_to_return(c(
      list('timestamp' = date()),
      shiny::isolate(app_data$reconciled_data)
    ))
  })

  return(data_to_return)

}
