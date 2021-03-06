% Generated by roxygen2: do not edit by hand
% Please edit documentation in R/mod_data_loader.R
\name{data_loader}
\alias{data_loader}
\title{Data loading screen: Server}
\usage{
data_loader(input, output, session, preloaded_path = NULL)
}
\arguments{
\item{input, output, session}{Auto-filled by callModule | ignore}

\item{preloaded_path}{File path relative to app that preloaded data is
stored. Defaults to \code{NULL}.}
}
\value{
Reactive object containing the data needed to run the main
Multimorbidity Explorer dashboard.
}
\description{
Data loading screen: Server
}
\examples{
callModule(data_loader, "data_loader", "data/preloaded")
}
