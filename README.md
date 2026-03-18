# QED-Nano-WebGPU
QED-Nano, a compact 4B model post-trained to write Olympiad-level mathematical proofs.


# QED-Nano

![logo.png](https://huggingface.co/lm-provers/QED-Nano/resolve/main/logo.png)


##  Table of Contents

1. [Model Summary](#model-summary)
2. [How to use](#how-to-use)
3. [Evaluation](#evaluation)
4. [Limitations](#limitations)
5. [License](#license)

## Model Summary

QED-Nano is a 4B parameter model explicitly post-trained to strengthen its proof-writing capabilities. Despite its small size, QED-Nano achieves an impressive 40% score on the challenging IMO-ProofBench benchmark (+20% over the Qwen3 base model), matching the performance of [GPT-OSS-120B](https://huggingface.co/openai/gpt-oss-120b) from OpenAI. With an agent scaffold that scales inference-time compute to over 1M tokens per problem, QED-Nano approaches the performance of Gemini-3-Pro. Crucially, the same agentic scaffold on the base model (Qwen3-4B-Thinking-2507) barely improves performance.

![imoproofbench.png](https://huggingface.co/lm-provers/QED-Nano/resolve/main/imoproofbench.png)

QED-Nano is based on [Qwen/Qwen3-4B-Thinking-2507](https://huggingface.co/Qwen/Qwen3-4B-Thinking-2507), and was post-trained via a combination of supervised fine-tuning and [reinforcement learning with a reasoning cache](https://huggingface.co/papers/2602.03773) (to be able to train for continual improvement with our agentic scaffold at test time) on a mixture of Olympiads proof problems from various public sources.

For more details refer to our blog post: https://huggingface.co/spaces/lm-provers/qed-nano-blogpost


## How to use

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model_name = "lm-provers/QED-Nano"
device = "cuda"  # for GPU usage or "cpu" for CPU usage

# load the tokenizer and the model
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
).to(device)

# prepare the model input
prompt = "Generate a rigorous proof to the following question: is \sqrt{2} rational or irrational?"
messages_think = [
    {"role": "user", "content": prompt}
]

text = tokenizer.apply_chat_template(
    messages_think,
    tokenize=False,
    add_generation_prompt=True,
)
model_inputs = tokenizer([text], return_tensors="pt").to(model.device)

# Generate the output
generated_ids = model.generate(**model_inputs, max_new_tokens=32768)

# Get and decode the output
output_ids = generated_ids[0][len(model_inputs.input_ids[0]) :]
print(tokenizer.decode(output_ids, skip_special_tokens=True))
```

>[!TIP]
> We recommend setting `temperature=0.6` and `top_p=0.95` in the sampling parameters.

### vLLM and SGLang

You can use vLLM and SGLang to deploy the model in an API compatible with OpenAI format.

#### SGLang

```bash
python -m sglang.launch_server --model-path lm-provers/QED-Nano
```

#### vLLM

```bash
vllm serve lm-provers/QED-Nano
```

## Evaluation

In this section, we report the evaluation results of QED-Nano on IMO-ProofBench, ProofBench, and IMO-AnswerBench. All evaluations except those on IMO-AnswerBench are reported as avg@3 unless stated otherwise.


| Model | IMO-ProofBench | ProofBench | IMO-AnswerBench |
|:---|:---:|:---:|:---:|
| Qwen3-4B-Thinking-2507 | 20.4 (2.6) | 19.5 (0.9) | 55.8 |
| **QED-Nano-SFT** | **39.5 (2.9)** | **33.3 (0.5)** | **57.5** |
| **QED-Nano** | **40.0 (0.6)** | **44.9 (3.4)** | **67.5** |
| **QED-Nano (Agent)** | **54.0 (3.7)** | **54.4 (2.4)** | **-** |
| Qwen3-30B-A3B-Thinking-2507 | 27.6 (1.0) | 26.1 (2.4) | 67.0 |
| Qwen3-235B-A22B-Thinking-2507 | 34.1 (0.7) | 33.7 (1.1) | 70.5 |
| Nomos-1 | 40.3 (3.5) | 28.3 (3.9) | 49.0 |
| GPT-OSS-20B | 38.3 (1.2) | 38.4 (3.9) | 61.5 |
| GPT-OSS-120B | 43.1 (3.2) | 47.5 (1.7) | 70.5 |
| DeepSeek-Math-V2 | 57.9 (2.0) | 60.6 (0.1) | 75.8 |
| Gemini 3 Pro | 58.7 (2.9) | 66.7 (3.1) | 83.2 |

## Training

### Model

- **Architecture:** Transformer decoder
- **Precision:** bfloat16
- **Base Model**: [lm-provers/QED-Nano-SFT](https://huggingface.co/lm-provers/QED-Nano-SFT)
- **Parameters**: 4 billion
- **Training Data**: [lm-provers/FineProofs-RL](https://huggingface.co/datasets/lm-provers/FineProofs-RL) (5,227 problems)

### Training Hyperparameters

- **Optimization Steps**: 150
- **Number of prompts per batch**: 64
- **Number of rollouts per prompt**: 16
- **Global batch size:** 1024
- **Max Rollout Length**: 49,152 tokens
- **Learning Rate Schedule**: Constant with a learning rate of 1e-6
- **Sampling temperature:** 0.8
- **LLM grader:** GPT-OSS-20B with medium reasoning effort and sampling at temperature 1.0

### Software & hardware

- **GPU topology (each node has 8xH100s):** 7 generator nodes, 4 trainer nodes, 1 grader node.
- **Training time:** 4 days or 9,216 H100 hours
- **Training and evaluation framework:** [CMU-AIRe/QED-Nano](https://github.com/CMU-AIRe/QED-Nano)


## Limitations

QED-Nano is a domain-specific model that is designed for one thing and one thing only: proving theorems. Using as a general assistant will likely produce nonsense outside of this domain. These models should be used as assistive tools rather than definitive sources of information. Users should always verify important information and critically evaluate any generated content.

## License

[Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)

## Acknowledgements

QED-Nano is a joint collaboration between the research teams at CMU, ETH Zurich, Numina, and Hugging Face. Below is a list of the individual contributors and their affiliations:

### CMU

Amrith Setlur, Yuxiao Qu, Ian Wu, and Aviral Kumar

### ETH Zurich

Jasper Dekoninck

### Numina

Jia Li

### Hugging Face

Edward Beeching and Lewis Tunstall
