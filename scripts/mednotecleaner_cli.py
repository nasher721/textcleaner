#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1] / 'backend'))
from app.inference import infer_text
from app.training import train_all
from app.database import db, row_to_dict, init_db, seed_data_if_empty


def cmd_infer(args):
    text = Path(args.input).read_text()
    out = infer_text(text, None if args.model == 'latest' else args.model)
    Path(args.out).write_text(json.dumps(out, indent=2))
    Path(args.cleaned).write_text(out['cleaned_text'])


def cmd_train(args):
    out = train_all(max_steps=args.max_steps, lr=0.001, base_model='en')
    print(json.dumps(out, indent=2))


def cmd_export(args):
    with db() as conn:
        rows = conn.execute('SELECT n.id as note_id,n.raw_text,s.label,s.start_char,s.end_char,s.text FROM span_annotations s JOIN notes n ON n.id=s.note_id').fetchall()
    lines = [json.dumps(row_to_dict(r)) for r in rows]
    Path(args.out).write_text('\n'.join(lines))


def main():
    init_db(); seed_data_if_empty()
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest='cmd', required=True)
    i = sub.add_parser('infer'); i.add_argument('--model', default='latest'); i.add_argument('--in', dest='input', required=True); i.add_argument('--out', required=True); i.add_argument('--cleaned', required=True); i.set_defaults(func=cmd_infer)
    t = sub.add_parser('train'); t.add_argument('--max-steps', type=int, default=2000); t.set_defaults(func=cmd_train)
    e = sub.add_parser('export'); e.add_argument('--out', required=True); e.set_defaults(func=cmd_export)
    a = p.parse_args(); a.func(a)


if __name__ == '__main__':
    main()
