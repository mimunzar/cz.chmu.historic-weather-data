CHMU Historic Weather Data
==========================

CHMU  Historic  Weather  Data  tool  provides  automation  for  downloading  and
aggregating a climatic data from Czech Hydrometeorological Institute  [1].   The
tool  works  on  data  from  the  daily  and  monthly   reports   page   [2][3].


Installation
------------

To install the tool you will need to  have  node  and  npm  programs  installed.
Then  navigate  to  the  project's  folder  and  issue  the  following  command:

    npm install

Note: The program was developed with node 16.9.


Usage for Data Download
-----------------------

To start downloading data issue the following command from the project's folder:

    npm run download <URL>

Where the <URL> is one of [2] or [3].  The process is able to be restarted  from
a given checkpoint. The checkpoint is identified from the program's output. For
example, to start downloading from the checkpoint no.   4  issue  the  following
command:

    npm run download <URL> 4

Downloading will start from the fourth item on a reports page.   Data  is  being
saved to the ./data/ folder.


Usage for Data Aggregation
--------------------------

To start aggregating data issue the following command from the project's folder:

    npm run aggregate

The process is able to be restarted from a given checkpoint.  The checkpoint  is
identified from the program's output.  For example, to  start  aggregating  from
the checkpoint no. 4 issue the following command:

    npm run aggregate 4

The output is being written to ./data/ folder as CSV files.

Possible Improvements
---------------------

    - Make it possible for program to stop when reached a certain checkpoint.
      The work than could be divided into buckets and parallelized.
    - Currently the output files are too large for certain analytical programs.
      Make it possible to configure max. number of rows written per file.


References
----------

    [1]: https://www.chmi.cz/
    [2]: https://www.chmi.cz/historicka-data/pocasi/denni-data/Denni-data-dle-z.-123-1998-Sb
    [3]: https://www.chmi.cz/historicka-data/pocasi/mesicni-data/mesicni-data-dle-z.-123-1998-Sb

