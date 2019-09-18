context("Demo Apps")

library(shinytest)

test_that("Main dashboard app works", {
  # Don't run these tests on the CRAN build servers
  skip_on_cran()

  # Use compareImages=FALSE because the expected image screenshots were created
  # on a Mac, and they will differ from screenshots taken on the CI platform,
  # which runs on Linux.
  appdir <- system.file(package = "meToolkit", "demo_app")
  expect_pass(
    testApp(
      appdir,
      "mytest",
      quiet = TRUE
    )
  )
})


loading_app_dir <- system.file(package = "meToolkit", "data_loading_app")

test_that("Data loading app landing looks right", {
  # Don't run these tests on the CRAN build servers
  skip_on_cran()

  expect_pass(
    testApp(
      loading_app_dir,
      testnames = 'basic_no_preloaded',
      quiet = TRUE
    )
  )
})

test_that("Data loading app can use preloaded data", {
  # Don't run these tests on the CRAN build servers
  skip_on_cran()

  expect_pass(
    testApp(
      loading_app_dir,
      testnames = 'preloaded_data',
      quiet = TRUE
    )
  )
})

test_that("Data loading app processes input data properly", {
  # Don't run these tests on the CRAN build servers
  skip_on_cran()

  expect_pass(
    testApp(
      loading_app_dir,
      testnames = 'load_all_data',
      quiet = TRUE
    )
  )
})

