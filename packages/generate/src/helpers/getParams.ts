import yargs from 'yargs/yargs';
import { argv } from 'node:process';
import type { ProcessFunctionParams } from '../types';
import {
  PROCESS_ARGUMENT_PARAMS,
  PROCESS_ARGUMENT_VECTORS,
} from '../constants';

export function getParams(): ProcessFunctionParams {
  const parser = yargs(argv.slice(2))
    // yargs enables its own help option by default, and any multi-character
    // name it is given doubles as an implicit command. That implicit `help`
    // command consumes the `help` argument (printing the usage text and
    // exiting) before the `help` command registered below can be dispatched,
    // so the built-in is turned off here and `--help` is declared and handled
    // explicitly instead. It has to be turned off before the replacement
    // option is declared, because disabling it deletes the `help` key from
    // the parser's hints.
    .help(false)
    .command(
      PROCESS_ARGUMENT_VECTORS[0].argument,
      'Initialises the AutoGraphCraft configuration',
      {
        [PROCESS_ARGUMENT_PARAMS.DEFAULT]: {
          type: 'boolean',
          description:
            'Uses the default configuration values when initialising the config',
          alias: PROCESS_ARGUMENT_PARAMS.DEFAULT_SHORT,
        },
      }
    )
    .command(
      PROCESS_ARGUMENT_VECTORS[1].argument,
      'Configures the AutoGraphCraft configuration'
    )
    .command(
      PROCESS_ARGUMENT_VECTORS[3].argument,
      'Generates the models from the schema',
      {
        [PROCESS_ARGUMENT_PARAMS.USERNAME]: {
          type: 'string',
          description: 'Username for the AutoGraphCraft account',
        },
        [PROCESS_ARGUMENT_PARAMS.PASSWORD]: {
          type: 'string',
          description: 'Password for the AutoGraphCraft account',
        },
        [PROCESS_ARGUMENT_PARAMS.FORCE]: {
          type: 'boolean',
          description:
            'Forces the generate command to run even if the schema has not changed',
          alias: PROCESS_ARGUMENT_PARAMS.FORCE_SHORT,
        },
        [PROCESS_ARGUMENT_PARAMS.CLEAN_MODELS]: {
          type: 'boolean',
          description:
            'Cleans the models directory if a model is no longer in the schema',
          alias: PROCESS_ARGUMENT_PARAMS.CLEAN_MODELS_SHORT,
        },
        [PROCESS_ARGUMENT_PARAMS.DRY_RUN]: {
          type: 'boolean',
          description: 'Runs the generate command without writing any files',
          alias: PROCESS_ARGUMENT_PARAMS.DRY_RUN_SHORT,
        },
      }
    )
    .command(PROCESS_ARGUMENT_VECTORS[2].argument, 'Opens the help webpage')
    .options({
      [PROCESS_ARGUMENT_PARAMS.QUIET]: {
        type: 'boolean',
        description: 'Runs the command without any logging',
        alias: PROCESS_ARGUMENT_PARAMS.QUIET_SHORT,
      },
      [PROCESS_ARGUMENT_PARAMS.HELP]: {
        type: 'boolean',
        description: 'Shows this usage information',
      },
    });

  const parsedArguments = parser.parseSync();

  // yargs types every parsed flag as `unknown` and the positional arguments as
  // `(string | number)[]`, so this is the single place where the parser output
  // is narrowed to the shape the process functions consume.
  const params = {
    ...parsedArguments,
    _: parsedArguments._.map(String),
  } as ProcessFunctionParams;

  // `--help` keeps its conventional meaning of printing the usage text, which
  // the built-in option would have done before it was disabled above.
  //
  // `showHelp` prints the usage text yargs built for the parse that just ran,
  // so the output is deliberately scoped to what was on the command line:
  //
  //   autographcraft --help            -> the top-level usage, listing every
  //                                       command and the global options
  //   autographcraft generate --help   -> the `generate` usage, describing that
  //                                       command and its own options
  //
  // The per-command form is the useful one — a user asking for help while
  // typing a command wants that command's options, not the command list — so
  // this is the intended behaviour rather than an accident of the parser, and
  // `getParams.spec.ts` pins both forms.
  //
  // Printing help is a terminal action: the process exits with 0 here and
  // `main` is never handed the parsed arguments.
  if (params[PROCESS_ARGUMENT_PARAMS.HELP]) {
    parser.showHelp('log');
    process.exit(0);
  }

  return params;
}
